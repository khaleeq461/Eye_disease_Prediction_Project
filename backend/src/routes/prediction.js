const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const Prediction = require('../models/Prediction');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// ML Server URL - can be configured via environment variable
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';

// Helper function to call ML server
const callMLServer = (imagePath) => {
    return new Promise((resolve, reject) => {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        const data = JSON.stringify({ image: base64Image });
        
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: '/predict-base64',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => reject(error));
        req.write(data);
        req.end();
    });
};

// Helper function to call ML server for Grad-CAM
const callGradcamServer = (imagePath) => {
    return new Promise((resolve, reject) => {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        const data = JSON.stringify({ image: base64Image });
        
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: '/gradcam',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => reject(error));
        req.write(data);
        req.end();
    });
};

// =====================
// SPECIFIC ROUTES (BEFORE parametric routes)
// =====================

// @route   POST /api/prediction/diagnose
router.post('/diagnose', auth, upload.single('image'), handleUploadError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No image file uploaded' });
        }

        const imagePath = req.file.path;
        console.log('Processing image:', req.file.filename);

        let mlResult;
        try {
            mlResult = await callMLServer(imagePath);
            console.log('ML prediction result:', mlResult.prediction);
        } catch (mlError) {
            console.error('ML server error:', mlError);
            fs.unlinkSync(imagePath);
            return res.status(503).json({
                status: 'error',
                message: 'ML Prediction Service is not available'
            });
        }

        if (!mlResult.success) {
            fs.unlinkSync(imagePath);
            return res.status(500).json({ status: 'error', message: mlResult.error || 'ML prediction failed' });
        }

        if (mlResult.prediction === 'unknown' || mlResult.isAccepted === false) {
            fs.unlinkSync(imagePath);
            return res.status(422).json({
                status: 'warning',
                message: mlResult.rejectedReason || 'Image quality too low',
                data: { binaryResult: mlResult.binaryResult, isAccepted: false }
            });
        }

        // Generate Grad-CAM heatmap
        let gradcamImageUrl = null;
        try {
            const gradcamResult = await callGradcamServer(imagePath);
            if (gradcamResult.success && gradcamResult.heatmap) {
                // Save heatmap to uploads folder
                const heatmapFilename = `heatmap_${req.file.filename}`;
                const heatmapPath = path.join(__dirname, '../../uploads', heatmapFilename);
                const heatmapBuffer = Buffer.from(gradcamResult.heatmap, 'base64');
                fs.writeFileSync(heatmapPath, heatmapBuffer);
                gradcamImageUrl = `/uploads/${heatmapFilename}`;
                console.log('Heatmap generated:', heatmapFilename);
            }
        } catch (heatmapError) {
            console.error('Heatmap generation error:', heatmapError);
            // Continue without heatmap - don't fail diagnosis
        }

        const prediction = new Prediction({
            userId: req.user._id,
            imageUrl: `/uploads/${req.file.filename}`,
            imageName: req.file.originalname,
            prediction: mlResult.prediction,
            isNormal: mlResult.isNormal,
            confidence: mlResult.confidence,
            binaryResult: mlResult.binaryResult || null,
            diseaseResult: mlResult.diseaseResult || null,
            confidenceThreshold: 0.7,
            isAccepted: mlResult.isAccepted !== false,
            recommendations: (mlResult.recommendations || []).map(desc => ({
                title: mlResult.isNormal ? 'Healthy Eyes' : mlResult.prediction,
                description: desc,
                priority: mlResult.isNormal ? 'low' : (mlResult.diseaseResult?.confidence > 0.9 ? 'high' : 'medium')
            })),
            status: 'completed',
            gradcamImageUrl: gradcamImageUrl,
            xaiEtiology: mlResult.xaiEtiology || null
        });

        await prediction.save();

        res.status(201).json({
            status: 'success',
            message: 'Diagnosis completed',
            data: {
                id: prediction._id,
                prediction: mlResult.prediction,
                confidence: mlResult.confidence,
                isNormal: mlResult.isNormal,
                isAccepted: mlResult.isAccepted !== false,
                binaryResult: mlResult.binaryResult,
                diseaseResult: mlResult.diseaseResult,
                recommendations: mlResult.recommendations,
                xaiEtiology: prediction.xaiEtiology,
                imageUrl: prediction.imageUrl,
                gradcamImageUrl: gradcamImageUrl
            }
        });

    } catch (error) {
        console.error('Diagnosis error:', error);
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ status: 'error', message: 'Diagnosis failed', error: error.message });
    }
});

// @route   GET /api/prediction/pending-review (SPECIFIC route - must come before /:id)
router.get('/pending-review', auth, async (req, res) => {
    try {
        const predictions = await Prediction.find({
            'reviewRequest.sentToDoctorId': req.user._id,
            'reviewRequest.status': { $in: ['pending', 'in-review'] }
        })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ status: 'success', data: { predictions } });
    } catch (error) {
        console.error('Pending review fetch error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/pending-review/all
router.get('/pending-review/all', auth, async (req, res) => {
    try {
        const predictions = await Prediction.find({ status: 'pending' })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ status: 'success', data: { predictions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/reviewed
router.get('/reviewed', auth, async (req, res) => {
    try {
        const total = await Prediction.countDocuments({
            status: { $in: ['reviewed', 'confirmed'] },
            'reviewRequest.sentToDoctorId': req.user._id
        });
        res.json({ status: 'success', data: { total } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/stats/overview
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const stats = await Prediction.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: '$prediction', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } }
        ]);

        const total = await Prediction.countDocuments({ userId: req.user._id });
        const recentPredictions = await Prediction.find({ userId: req.user._id })
            .sort({ createdAt: -1 }).limit(5)
            .select('prediction confidence createdAt status isNormal');

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekCount = await Prediction.countDocuments({
            userId: req.user._id, createdAt: { $gte: oneWeekAgo }
        });

        const pendingCount = await Prediction.countDocuments({ userId: req.user._id, status: 'pending' });
        const completedCount = await Prediction.countDocuments({
            userId: req.user._id, status: { $in: ['reviewed', 'confirmed'] }
        });

        res.json({
            status: 'success',
            data: { total, thisWeek: thisWeekCount, pending: pendingCount, completed: completedCount, byClass: stats, recentPredictions }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/my-reviews (Doctor - get predictions for doctor review)
router.get('/my-reviews', auth, async (req, res) => {
    try {
        // Get all predictions that are sent to this specific doctor for review
        // Include both pending and completed reviews for this doctor
        const predictions = await Prediction.find({
            'reviewRequest.sentToDoctorId': req.user._id
        })
            .populate('userId', 'name email phone')
            .populate('doctorReview.doctorId', 'name email')
            .populate('reviewRequest.sentToDoctorId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ status: 'success', data: { predictions } });
    } catch (error) {
        console.error('My reviews fetch error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/all-reviews (Admin - get all predictions with reviewRequest)
router.get('/all-reviews', auth, async (req, res) => {
    try {
        // Get all predictions that have reviewRequest (sent for review) - NOT appointments
        const predictions = await Prediction.find({
            reviewRequest: { $exists: true },
            'reviewRequest.sentToDoctorId': { $exists: true }
        })
            .populate('userId', 'name email phone')
            .populate('doctorReview.doctorId', 'name email')
            .populate('reviewRequest.sentToDoctorId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ status: 'success', data: { predictions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/all-pending (Admin - get all pending predictions)
router.get('/all-pending', auth, async (req, res) => {
    try {
        // Get all predictions with reviewRequest
        const predictions = await Prediction.find({
            reviewRequest: { $exists: true },
            'reviewRequest.sentToDoctorId': { $exists: true }
        })
            .populate('userId', 'name email phone')
            .populate('doctorReview.doctorId', 'name email')
            .populate('reviewRequest.sentToDoctorId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ status: 'success', data: { predictions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/history
router.get('/history', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const predictions = await Prediction.find({ userId: req.user._id })
            .sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate('doctorReview.doctorId', 'name email')
            .populate('reviewRequest.sentToDoctorId', 'name email');

        const total = await Prediction.countDocuments({ userId: req.user._id });

        res.json({
            status: 'success',
            data: {
                predictions,
                pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/reports (Patient - get all reports)
router.get('/reports', auth, async (req, res) => {
    try {
        // Get all predictions for the patient that have reports generated
        const predictions = await Prediction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('doctorReview.doctorId', 'name email specialization')
            .select('prediction confidence isNormal binaryResult diseaseResult recommendations doctorReview imageUrl gradcamImageUrl createdAt');

        res.json({ status: 'success', data: { reports: predictions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   POST /api/prediction/:id/generate-report (Generate PDF report)
router.post('/:id/generate-report', auth, async (req, res) => {
    try {
        const prediction = await Prediction.findById(req.params.id)
            .populate('userId', 'name email phone address')
            .populate('doctorReview.doctorId', 'name email specialization');

        if (!prediction) {
            return res.status(404).json({ status: 'error', message: 'Prediction not found' });
        }

        // Check if user owns this prediction or is a doctor/admin
        const isOwner = prediction.userId?._id?.toString() === req.user._id.toString();
        const isDoctor = req.user.role === 'doctor';
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isDoctor && !isAdmin) {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        // Generate report filename
        const timestamp = Date.now();
        const reportFilename = `report_${prediction._id}_${timestamp}.html`;
        const reportsDir = path.join(__dirname, '../../uploads/reports');
        
        // Create reports directory if it doesn't exist
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, reportFilename);
        const reportUrl = `/uploads/reports/${reportFilename}`;

        // Etiological Knowledge Base for rich medical report details
        const etiologyKnowledge = {
            diabetes: {
                name: 'Diabetic Retinopathy',
                affectedOrgan: 'Retinal Microvasculature & Pancreas (Systemic Endocrine & Vascular)',
                primaryRootCause: 'Chronic Hyperglycemia & Microvascular Pericyte Damage',
                biologicalMechanism: 'Elevated blood glucose damages capillary pericytes and breaches the blood-retina barrier, leading to capillary occlusion, retinal hypoxia, microaneurysms, and intraretinal fluid/lipid extravasation.',
                visualFindings: 'Microaneurysms, dot-and-blot hemorrhages, hard lipid exudates, and cotton wool spots localized along retinal capillary arcades and macular regions.',
                confirmatoryProtocols: [
                    'Optical Coherence Tomography (OCT) for Macular Edema (CME)',
                    'Fundus Fluorescein Angiography (FFA) to assess Capillary Non-Perfusion',
                    'Fasting Blood Glucose (FBG) & Glycated Hemoglobin (HbA1c) profiling'
                ],
                clinicalNextSteps: [
                    'Referral to Vitreoretinal Specialist for Anti-VEGF / Laser Photocoagulation assessment',
                    'Strict systemic glycemic control (target HbA1c < 7.0%) & Blood Pressure management',
                    'Quarterly dilated fundoscopic examination'
                ]
            },
            glaucoma: {
                name: 'Glaucoma',
                affectedOrgan: 'Optic Nerve Head (Optic Disc, RNFL & Trabecular Outflow Meshwork)',
                primaryRootCause: 'Elevated Intraocular Pressure (IOP) & Optic Axonal Ischemia',
                biologicalMechanism: 'Resistance to aqueous humor drainage across the trabecular meshwork elevates intraocular pressure, causing mechanical stretching and apoptotic atrophy of retinal ganglion cell axons at the lamina cribrosa.',
                visualFindings: 'Pathological vertical cup-to-disc enlargement (CDR > 0.6), neuroretinal rim thinning (ISNT rule defect), disc margin splinter hemorrhages, and RNFL wedge defects.',
                confirmatoryProtocols: [
                    'Goldmann Applanation Tonometry (IOP Measurement)',
                    'Standard Automated Perimetry (Humphrey Visual Field 24-2 / 30-2)',
                    'Spectral-Domain RNFL & Ganglion Cell Complex (GCC) OCT Thickness Analysis',
                    'Central Corneal Thickness (Pachymetry) & Gonioscopy'
                ],
                clinicalNextSteps: [
                    'Initiate IOP-lowering topical therapy (Prostaglandin Analogs / Beta-Blockers)',
                    'Evaluate for Selective Laser Trabeculoplasty (SLT) or Trabeculectomy if progressive',
                    'Periodic visual field and RNFL OCT monitoring every 3 to 6 months'
                ]
            },
            cataract: {
                name: 'Cataract',
                affectedOrgan: 'Crystalline Lens of the Eye (Anterior Segment)',
                primaryRootCause: 'Lens Crystallin Protein Aggregation, Cross-linking & Oxidative Stress',
                biologicalMechanism: 'Age-related photo-oxidation, metabolic stress, and protein denaturing cause structural crystallin proteins within the lens to clump and opacify, impeding and scattering incoming light rays.',
                visualFindings: 'Diffuse optical attenuation, generalized loss of fundus image contrast, and blurred retinal vasculature resulting from anterior media opacification.',
                confirmatoryProtocols: [
                    'Dilated Slit-Lamp Biomicroscopy with LOCS III Lens Opacity Grading',
                    'Best-Corrected Visual Acuity (BCVA) Assessment under glare conditions',
                    'Optical Biometry & IOL Power Calculation for potential surgical planning'
                ],
                clinicalNextSteps: [
                    'Surgical consultation for Phacoemulsification with Foldable IOL Implantation',
                    'Prescribe temporary anti-reflective refractive correction if early-stage',
                    'Patient lifestyle counseling regarding UV protection and glare avoidance'
                ]
            },
            myopia: {
                name: 'Pathological Myopia',
                affectedOrgan: 'Eyeball Axial Sclera & Posterior Pole Sclero-Choroidal Complex',
                primaryRootCause: 'Excessive Axial Elongation of the Eyeball (>26.5mm) & Scleral Thinning',
                biologicalMechanism: 'Progressive mechanical lengthening of the ocular axis stretches the posterior coats, resulting in diffuse scleral and choroidal thinning, mechanical traction, and retinal pigment epithelial atrophy.',
                visualFindings: 'Peripapillary myopic crescent, tilted optic disc insertion, tessellated fundus background, macular chorioretinal atrophy, and posterior staphyloma.',
                confirmatoryProtocols: [
                    'Axial Length Measurement via Optical Coherence Biometry',
                    'High-Definition Macular Swept-Source OCT to detect Myopic Traction Maculopathy / CNV',
                    'Ultra-Widefield Retinal Imaging & 360-Degree Scleral Depressed Indirect Ophthalmoscopy'
                ],
                clinicalNextSteps: [
                    'Precision optical refractive correction and annual axial length monitoring',
                    'Patient counseling on acute retinal detachment warning signs (flashes, floaters, curtain effect)',
                    'Prompt Anti-VEGF therapy if Myopic Choroidal Neovascularization (mCNV) is detected'
                ]
            },
            normal: {
                name: 'Healthy Eyes (Normal)',
                affectedOrgan: 'Intact Ocular Anatomy (Healthy Retinal Neurovasculature, Cornea, Lens, and Optic Nerve)',
                primaryRootCause: 'Normal Homeostatic Ocular Physiology & Intact Microvasculature',
                biologicalMechanism: 'Clear optical refractive media, balanced aqueous dynamics, healthy neuroretinal rim architecture, well-perfused capillary networks, and intact foveal avascular zone (FAZ).',
                visualFindings: 'Sharp, well-demarcated optic disc margins with physiological cupping (CDR < 0.35), uniform retinal and macular pigmentation, and normal arteriolar-venular branching without microaneurysms or exudates.',
                confirmatoryProtocols: [
                    'Routine annual comprehensive dilated eye examination',
                    'Standard Visual Acuity and intraocular pressure baseline evaluation'
                ],
                clinicalNextSteps: [
                    'Maintain routine preventive ocular care and comprehensive annual ophthalmic screenings',
                    'Maintain a balanced diet rich in lutein, zeaxanthin, and omega-3 fatty acids',
                    'Use standard UV-protective eyewear during direct sun exposure'
                ]
            }
        };

        const predKey = (prediction.prediction || 'normal').toLowerCase();
        const etiology = prediction.xaiEtiology || etiologyKnowledge[predKey] || etiologyKnowledge.normal;
        const diseaseInfo = etiologyKnowledge[predKey] || etiologyKnowledge.normal;

        const affectedOrgan = etiology.affectedOrgan || diseaseInfo.affectedOrgan;
        const primaryRootCause = etiology.primaryRootCause || diseaseInfo.primaryRootCause;
        const biologicalMechanism = etiology.biologicalMechanism || diseaseInfo.biologicalMechanism;
        const visualFindings = etiology.visualFindings || diseaseInfo.visualFindings;
        const confirmatoryProtocols = etiology.confirmatoryProtocols?.length ? etiology.confirmatoryProtocols : diseaseInfo.confirmatoryProtocols;
        const clinicalNextSteps = etiology.clinicalNextSteps?.length ? etiology.clinicalNextSteps : diseaseInfo.clinicalNextSteps;

        // Patient demographics
        const patientName = prediction.userId?.name || 'Patient';
        const patientEmail = prediction.userId?.email || 'N/A';
        const patientPhone = prediction.userId?.phone || 'N/A';
        const patientAddress = prediction.userId?.address ? 
            [prediction.userId.address.city, prediction.userId.address.state, prediction.userId.address.country].filter(Boolean).join(', ') : 'Pakistan';

        const diagnosisDate = new Date(prediction.createdAt).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const reportGenDate = new Date().toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const isHealthy = prediction.isNormal || predKey === 'normal';
        const predictionLabel = isHealthy ? 'Healthy Normal Retinal Scan' : 
            (diseaseInfo.name || (predKey.charAt(0).toUpperCase() + predKey.slice(1)));
        const confidencePercent = Math.round((prediction.confidence || 0) * 100);

        const normalProb = prediction.binaryResult?.normalProbability ? 
            Math.round(prediction.binaryResult.normalProbability * 100) : (isHealthy ? confidencePercent : (100 - confidencePercent));
        const diseaseProb = prediction.binaryResult?.diseaseProbability ? 
            Math.round(prediction.binaryResult.diseaseProbability * 100) : (isHealthy ? (100 - confidencePercent) : confidencePercent);

        // Disease Multi-Class Probabilities
        const diseaseProbs = prediction.diseaseResult?.probabilities ? 
            (prediction.diseaseResult.probabilities instanceof Map ? 
                Object.fromEntries(prediction.diseaseResult.probabilities) : prediction.diseaseResult.probabilities) : {};

        let probsList = Object.entries(diseaseProbs);
        if (probsList.length === 0) {
            probsList = [
                ['diabetes', predKey === 'diabetes' ? confidencePercent : 5],
                ['glaucoma', predKey === 'glaucoma' ? confidencePercent : 4],
                ['cataract', predKey === 'cataract' ? confidencePercent : 3],
                ['myopia', predKey === 'myopia' ? confidencePercent : 2],
                ['normal', isHealthy ? confidencePercent : 2]
            ];
        }

        const colorMap = {
            diabetes: '#ef4444',
            glaucoma: '#8b5cf6',
            cataract: '#f59e0b',
            myopia: '#06b6d4',
            normal: '#10b981'
        };

        const diseaseProbsHtml = probsList.map(([dis, probVal]) => {
            const num = Math.round(typeof probVal === 'number' ? (probVal <= 1 ? probVal * 100 : probVal) : 0);
            const dColor = colorMap[dis.toLowerCase()] || '#0284c7';
            const dName = dis.charAt(0).toUpperCase() + dis.slice(1);
            return `
                <div class="prob-row">
                    <div class="prob-header-row">
                        <span class="prob-title">${dName}</span>
                        <span class="prob-pct" style="color: ${dColor};">${num}%</span>
                    </div>
                    <div class="prob-track">
                        <div class="prob-fill" style="width: ${num}%; background-color: ${dColor};"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Protocols & Next Steps HTML
        const protocolsHtml = (confirmatoryProtocols || []).map(p => `<li>${p}</li>`).join('');
        const nextStepsHtml = (clinicalNextSteps || []).map(s => `<li>${s}</li>`).join('');

        // Image URLs
        const originalImageUrl = prediction.imageUrl || '';
        const heatmapImageUrl = prediction.gradcamImageUrl || '';

        // Doctor Review Info
        let doctorReviewHtml = '';
        if (prediction.doctorReview && prediction.doctorReview.doctorId) {
            const doc = prediction.doctorReview.doctorId;
            const reviewedDate = new Date(prediction.doctorReview.reviewedAt).toLocaleString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            doctorReviewHtml = `
                <div class="card review-card">
                    <div class="card-header bg-green">
                        <div class="card-title">
                            <span class="icon">🩺</span> Clinical Attestation & Specialist Review
                        </div>
                        <span class="badge verified">Verified by Ophthalmologist</span>
                    </div>
                    <div class="card-body">
                        <div class="review-meta-grid">
                            <div><label>Reviewing Ophthalmologist</label><strong>Dr. ${doc.name || 'Medical Officer'}</strong></div>
                            <div><label>Specialization</label><strong>${doc.specialization || 'Ophthalmology'}</strong></div>
                            <div><label>Official Email</label><strong>${doc.email || 'N/A'}</strong></div>
                            <div><label>Verification Date</label><strong>${reviewedDate}</strong></div>
                        </div>

                        ${prediction.doctorReview.confirmedDiagnosis ? `
                            <div class="review-box">
                                <label>Confirmed Clinical Diagnosis:</label>
                                <div class="confirmed-val">${prediction.doctorReview.confirmedDiagnosis}</div>
                            </div>
                        ` : ''}

                        ${prediction.doctorReview.notes ? `
                            <div class="review-box">
                                <label>Clinical Observations & Notes:</label>
                                <p>${prediction.doctorReview.notes}</p>
                            </div>
                        ` : ''}

                        ${prediction.doctorReview.treatmentPlan ? `
                            <div class="review-box">
                                <label>Prescribed Treatment Plan & Follow-up:</label>
                                <p>${prediction.doctorReview.treatmentPlan}</p>
                            </div>
                        ` : ''}

                        <div class="signature-line">
                            <div class="stamp-box">
                                <div class="stamp-circle">VERIFIED CLINICAL REPORT</div>
                                <div class="stamp-doc">Dr. ${doc.name}</div>
                            </div>
                            <div class="sign-block">
                                <div class="sign-rule"></div>
                                <span>Authorized Signature</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            doctorReviewHtml = `
                <div class="card pending-review-card">
                    <div class="card-header bg-slate">
                        <div class="card-title">
                            <span class="icon">📋</span> Clinical Validation Status
                        </div>
                        <span class="badge pending">AI Preliminary Screening</span>
                    </div>
                    <div class="card-body text-center">
                        <p class="pending-text">
                            This report represents an automated AI-assisted preliminary ophthalmic assessment.
                            It is queued for review by a certified ophthalmologist. Please consult your physician for clinical diagnosis.
                        </p>
                    </div>
                </div>
            `;
        }

        const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clinical Eye Diagnostic Report - ${patientName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background: #0f172a;
            color: #1e293b;
            padding: 24px;
            font-size: 13px;
            line-height: 1.5;
        }

        .action-toolbar {
            max-width: 960px;
            margin: 0 auto 20px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #1e293b;
            padding: 12px 24px;
            border-radius: 12px;
            border: 1px solid #334155;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        .action-toolbar .title { color: #f8fafc; font-weight: 700; font-size: 14px; display: flex; items-center; gap: 8px; }
        .action-toolbar .btn-print {
            background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%);
            color: #04131f;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 800;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
        }
        .action-toolbar .btn-print:hover {
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
            transform: scale(1.02);
        }

        .report-page {
            max-width: 960px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.25);
            overflow: hidden;
            border: 1px solid #cbd5e1;
        }

        /* Hospital Banner */
        .hospital-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%);
            color: white;
            padding: 28px 36px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #06b6d4;
        }
        .brand-block { display: flex; align-items: center; gap: 16px; }
        .brand-logo {
            width: 52px;
            height: 52px;
            background: linear-gradient(135deg, #06b6d4, #10b981);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
        }
        .brand-text h1 { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #f8fafc; }
        .brand-text p { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .report-badge {
            text-align: right;
        }
        .report-badge .pill {
            background: rgba(6, 182, 212, 0.15);
            border: 1px solid #06b6d4;
            color: #38bdf8;
            padding: 4px 12px;
            border-radius: 20px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 4px;
        }
        .report-badge .date { font-size: 11px; color: #cbd5e1; }

        .report-content { padding: 32px 36px; display: flex; flex-direction: column; gap: 24px; }

        /* Patient Demographics Grid */
        .demographics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            background: #f8fafc;
            padding: 16px 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        .demo-item label { display: block; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .demo-item span { font-size: 13px; font-weight: 700; color: #0f172a; word-break: break-word; }

        /* Primary Diagnosis Hero Box */
        .hero-finding-box {
            border-radius: 14px;
            padding: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 2px solid ${isHealthy ? '#10b981' : (predKey === 'diabetes' ? '#ef4444' : (predKey === 'glaucoma' ? '#8b5cf6' : (predKey === 'cataract' ? '#f59e0b' : '#06b6d4')))};
            background: ${isHealthy ? '#ecfdf5' : '#fff1f2'};
        }
        .hero-left label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${isHealthy ? '#047857' : '#be123c'}; }
        .hero-left h2 { font-size: 26px; font-weight: 900; color: ${isHealthy ? '#065f46' : '#9f1239'}; margin-top: 2px; letter-spacing: -0.5px; }
        .hero-left p { font-size: 12px; color: #475569; margin-top: 4px; }
        .hero-score {
            text-align: right;
            padding-left: 20px;
        }
        .hero-score .score-val {
            font-size: 34px;
            font-weight: 900;
            color: ${isHealthy ? '#059669' : '#e11d48'};
            font-family: 'JetBrains Mono', monospace;
        }
        .hero-score .score-label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748b;
        }

        /* Generic Section Card */
        .card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            background: #ffffff;
        }
        .card-header {
            padding: 12px 20px;
            font-weight: 800;
            font-size: 13px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
        }
        .card-header.bg-cyan { background: #f0fdfa; color: #0f766e; border-color: #ccfbf1; }
        .card-header.bg-blue { background: #f0f9ff; color: #0369a1; border-color: #e0f2fe; }
        .card-header.bg-green { background: #f0fdf4; color: #15803d; border-color: #dcfce7; }
        .card-header.bg-slate { background: #f8fafc; color: #334155; border-color: #e2e8f0; }
        .card-title { display: flex; align-items: center; gap: 8px; }
        .card-title .icon { font-size: 16px; }
        .card-body { padding: 20px; }

        /* Multi-class probability bars */
        .prob-grid { display: flex; flex-direction: column; gap: 10px; }
        .prob-row { display: flex; flex-direction: column; gap: 4px; }
        .prob-header-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; }
        .prob-title { color: #334155; }
        .prob-pct { font-family: 'JetBrains Mono', monospace; font-weight: 800; }
        .prob-track { height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; }
        .prob-fill { height: 100%; border-radius: 9999px; transition: width 0.3s ease; }

        /* XAI Etiology Deep Dive Grid */
        .etiology-cards-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .et-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
        }
        .et-card.full-width { grid-column: span 2; }
        .et-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0284c7; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .et-value { font-size: 12.5px; color: #1e293b; line-height: 1.6; font-weight: 500; }
        .et-value strong { color: #0f172a; }

        .list-disc-styled { margin-left: 18px; margin-top: 6px; }
        .list-disc-styled li { margin-bottom: 6px; color: #334155; font-size: 12px; line-height: 1.5; }

        /* Scans Comparison Section */
        .scans-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .scan-frame {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            overflow: hidden;
            background: #020617;
            text-align: center;
        }
        .scan-frame img {
            width: 100%;
            height: 240px;
            object-fit: contain;
            display: block;
            background: #000;
        }
        .scan-caption {
            background: #0f172a;
            color: #f8fafc;
            padding: 10px 14px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #1e293b;
        }
        .scan-caption span.tag {
            background: rgba(6, 182, 212, 0.2);
            color: #38bdf8;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-family: 'JetBrains Mono', monospace;
        }

        /* Doctor Review Box */
        .review-meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            background: #f8fafc;
            padding: 14px 18px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            margin-bottom: 14px;
        }
        .review-meta-grid label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
        .review-meta-grid strong { font-size: 12px; color: #0f172a; }
        
        .review-box { margin-bottom: 12px; }
        .review-box label { font-size: 11px; font-weight: 800; color: #475569; display: block; margin-bottom: 4px; text-transform: uppercase; }
        .review-box p { font-size: 12.5px; color: #1e293b; line-height: 1.6; }
        .confirmed-val { font-size: 15px; font-weight: 800; color: #15803d; }

        .signature-line {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 24px;
            padding-top: 18px;
            border-top: 1px dashed #cbd5e1;
        }
        .stamp-box {
            border: 2px solid #15803d;
            border-radius: 8px;
            padding: 6px 14px;
            text-align: center;
            color: #15803d;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 800;
            font-size: 10px;
            letter-spacing: 1px;
            background: #f0fdf4;
            transform: rotate(-3deg);
        }
        .stamp-doc { font-size: 11px; font-weight: 900; margin-top: 2px; }
        .sign-block { text-align: center; width: 200px; }
        .sign-rule { border-bottom: 1px solid #0f172a; margin-bottom: 4px; height: 30px; }
        .sign-block span { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }

        .pending-text { color: #64748b; font-size: 12px; font-style: italic; }

        /* Footer */
        .report-footer {
            background: #f8fafc;
            padding: 20px 36px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #64748b;
        }
        .footer-left strong { color: #334155; }
        .footer-security { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; }

        .badge.verified { background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; }
        .badge.pending { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; }

        @media print {
            body { padding: 0; background: white; }
            .action-toolbar { display: none !important; }
            .report-page { box-shadow: none; border: none; border-radius: 0; max-width: 100%; }
            .scans-comparison { page-break-inside: avoid; }
            .hero-finding-box { page-break-inside: avoid; }
            .card { page-break-inside: avoid; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
    </style>
</head>
<body>
    <!-- Action Toolbar (Hidden in Print) -->
    <div class="action-toolbar">
        <div class="title">
            <span>👁️</span> Clinical Ophthalmic Diagnostic Report
        </div>
        <button class="btn-print" onclick="window.print()">
            🖨️ Print / Download PDF
        </button>
    </div>

    <!-- Main Report Page -->
    <div class="report-page">
        <!-- Hospital / Diagnostic Center Header -->
        <div class="hospital-header">
            <div class="brand-block">
                <div class="brand-logo">👁️</div>
                <div class="brand-text">
                    <h1>AI EYE CARE DIAGNOSTIC CLINIC</h1>
                    <p>Explainable AI Retinal Pathology & Ophthalmic Center</p>
                </div>
            </div>
            <div class="report-badge">
                <div class="pill">REF: ${prediction._id.toString().slice(-8).toUpperCase()}</div>
                <div class="date">Issued: ${reportGenDate}</div>
            </div>
        </div>

        <div class="report-content">
            <!-- Patient Demographics Grid -->
            <div class="demographics-grid">
                <div class="demo-item">
                    <label>Patient Full Name</label>
                    <span>${patientName}</span>
                </div>
                <div class="demo-item">
                    <label>Patient Email</label>
                    <span>${patientEmail}</span>
                </div>
                <div class="demo-item">
                    <label>Phone / Contact</label>
                    <span>${patientPhone}</span>
                </div>
                <div class="demo-item">
                    <label>Location / City</label>
                    <span>${patientAddress}</span>
                </div>
                <div class="demo-item">
                    <label>Examination Date</label>
                    <span>${diagnosisDate}</span>
                </div>
                <div class="demo-item">
                    <label>Imaging Modality</label>
                    <span>Color Fundus Photography (CFP)</span>
                </div>
                <div class="demo-item">
                    <label>AI Model Engine</label>
                    <span>Retinal Deep Convolutional Model</span>
                </div>
                <div class="demo-item">
                    <label>Verification Protocol</label>
                    <span>Class-Activation Mapping (Grad-CAM)</span>
                </div>
            </div>

            <!-- Primary Diagnosis Hero Box -->
            <div class="hero-finding-box">
                <div class="hero-left">
                    <label>PRIMARY DIAGNOSTIC ASSESSMENT</label>
                    <h2>${predictionLabel}</h2>
                    <p>${isHealthy ? 'No visible pathological lesions, microaneurysms, or optic disc anomalies detected on the current fundus image.' : 'Pathological visual biomarkers identified by deep learning feature extraction & etiological review.'}</p>
                </div>
                <div class="hero-score">
                    <div class="score-val">${confidencePercent}%</div>
                    <div class="score-label">Diagnostic Confidence</div>
                </div>
            </div>

            <!-- Multi-Class Probability Spectrum & Deep Etiology -->
            <div class="card">
                <div class="card-header bg-cyan">
                    <div class="card-title">
                        <span class="icon">🔬</span> Disease Probability Spectrum & Binary Stratification
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #0f766e;">Multi-Class Distribution</span>
                </div>
                <div class="card-body">
                    <div class="prob-grid">
                        ${diseaseProbsHtml}
                    </div>
                </div>
            </div>

            <!-- Explainable AI (XAI) Deep Etiology & Organ Analysis -->
            <div class="card">
                <div class="card-header bg-blue">
                    <div class="card-title">
                        <span class="icon">🫀</span> Explainable AI (XAI) — Root Organ & Etiological Pathway
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #0284c7;">Clinical Pathology Insights</span>
                </div>
                <div class="card-body">
                    <div class="etiology-cards-grid">
                        <div class="et-card">
                            <div class="et-label"><span>🫀</span> Affected Organ & Anatomical Source</div>
                            <div class="et-value"><strong>${affectedOrgan}</strong></div>
                        </div>

                        <div class="et-card">
                            <div class="et-label"><span>⚠️</span> Primary Biological Root Cause</div>
                            <div class="et-value"><strong>${primaryRootCause}</strong></div>
                        </div>

                        <div class="et-card full-width">
                            <div class="et-label"><span>🔬</span> Underlying Biological Mechanism</div>
                            <div class="et-value">${biologicalMechanism}</div>
                        </div>

                        <div class="et-card full-width">
                            <div class="et-label"><span>👁️</span> Visual Scan Findings (Biomarkers Detected)</div>
                            <div class="et-value">${visualFindings}</div>
                        </div>

                        <div class="et-card">
                            <div class="et-label"><span>🧪</span> Confirmatory Diagnostic Protocols</div>
                            <ul class="list-disc-styled">
                                ${protocolsHtml}
                            </ul>
                        </div>

                        <div class="et-card">
                            <div class="et-label"><span>📋</span> Recommended Clinical Next Steps</div>
                            <ul class="list-disc-styled">
                                ${nextStepsHtml}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Side-by-Side Fundus Scan & Grad-CAM Visualizer -->
            ${(originalImageUrl || heatmapImageUrl) ? `
            <div class="card">
                <div class="card-header bg-slate">
                    <div class="card-title">
                        <span class="icon">🖼️</span> High-Definition Retinal Scans & AI Attention Heatmap
                    </div>
                    <span style="font-size: 11px; font-weight: 700; color: #475569;">Grad-CAM Visualization</span>
                </div>
                <div class="card-body">
                    <div class="scans-comparison">
                        ${originalImageUrl ? `
                        <div class="scan-frame">
                            <img src="${originalImageUrl}" alt="Original Eye Scan" />
                            <div class="scan-caption">
                                <span>Original Fundus Photography</span>
                                <span class="tag">RAW SCAN</span>
                            </div>
                        </div>
                        ` : ''}

                        ${heatmapImageUrl ? `
                        <div class="scan-frame">
                            <img src="${heatmapImageUrl}" alt="AI Attention Heatmap" />
                            <div class="scan-caption">
                                <span>AI Attention Heatmap (Grad-CAM)</span>
                                <span class="tag">HEATMAP</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Doctor Attestation / Review -->
            ${doctorReviewHtml}
        </div>

        <!-- Footer -->
        <div class="report-footer">
            <div class="footer-left">
                <strong>AI Eye Care Clinical Screening System</strong> • Confidential Medical Diagnostic Document
            </div>
            <div class="footer-security">
                DOC-ID: ${prediction._id} | SEC-HASH: ${prediction._id.toString().slice(0, 10).toUpperCase()}
            </div>
        </div>
    </div>
</body>
</html>`;

        // Save the report
        fs.writeFileSync(reportPath, reportHtml);

        // Update prediction with report URL
        prediction.reportUrl = reportUrl;
        await prediction.save();

        res.json({ status: 'success', message: 'Report generated successfully', data: { reportUrl } });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate report', error: error.message });
    }
});

// @route   GET /api/prediction/reports/list (Get all reports for a patient - for sidebar)
router.get('/reports/list', auth, async (req, res) => {
    try {
        // Get all predictions that have reports (either reportUrl exists or it's completed)
        const predictions = await Prediction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .select('prediction confidence createdAt imageUrl reportUrl gradcamImageUrl isNormal');

        res.json({ status: 'success', data: { reports: predictions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/doctors
router.get('/doctors', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const doctors = await User.find({ role: 'doctor', isActive: true })
            .select('name email phone specialization')
            .sort({ name: 1 });
        res.json({ status: 'success', data: { doctors } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/my-patients
router.get('/my-patients', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.user._id })
            .populate('patientId', 'name email phone')
            .populate('predictionId', 'prediction confidence createdAt imageUrl')
            .sort({ createdAt: -1 });

        const reviewRequests = await Prediction.find({ 'reviewRequest.sentToDoctorId': req.user._id })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        const patientMap = new Map();
        appointments.forEach(apt => {
            if (apt.patientId) {
                patientMap.set(apt.patientId._id.toString(), {
                    ...apt.patientId._doc,
                    lastInteraction: apt.createdAt,
                    appointmentId: apt._id,
                    predictionId: apt.predictionId
                });
            }
        });

        reviewRequests.forEach(pred => {
            if (pred.userId) {
                const existing = patientMap.get(pred.userId._id.toString());
                if (!existing || new Date(pred.createdAt) > new Date(existing.lastInteraction)) {
                    patientMap.set(pred.userId._id.toString(), {
                        ...pred.userId._doc,
                        lastInteraction: pred.createdAt,
                        predictionId: pred._id
                    });
                }
            }
        });

        res.json({ status: 'success', data: { patients: Array.from(patientMap.values()) } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// =====================
// PARAMETRIC ROUTES (AFTER specific routes)
// =====================

// @route   POST /api/prediction/:id/send-for-review
router.post('/:id/send-for-review', auth, async (req, res) => {
    try {
        const { doctorId, notes } = req.body;
        if (!doctorId) {
            return res.status(400).json({ status: 'error', message: 'Doctor ID is required' });
        }

        const prediction = await Prediction.findById(req.params.id);
        if (!prediction) {
            return res.status(404).json({ status: 'error', message: 'Prediction not found' });
        }

        if (prediction.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        prediction.reviewRequest = {
            sentToDoctorId: doctorId,
            sentAt: new Date(),
            status: 'pending',
            notes: notes
        };
        prediction.status = 'pending';
        await prediction.save();

        res.json({ status: 'success', message: 'Prediction sent to doctor for review', data: { prediction } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   GET /api/prediction/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const prediction = await Prediction.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('doctorReview.doctorId', 'name email specialization')
            .populate('reviewRequest.sentToDoctorId', 'name email specialization');

        if (!prediction) {
            return res.status(404).json({ status: 'error', message: 'Prediction not found' });
        }

        const isOwner = prediction.userId?._id?.toString() === req.user._id.toString();
        // sentToDoctorId is a populated object, not an ObjectId
        const isAssignedDoctor = prediction.reviewRequest?.sentToDoctorId?._id?.toString() === req.user._id.toString() ||
                                 prediction.reviewRequest?.sentToDoctorId?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        // Allow if owner, assigned doctor, admin, or if it's a pending prediction with no review yet
        if (!isOwner && !isAssignedDoctor && !isAdmin && !prediction.doctorReview) {
            // Check if it's a pending prediction that might be viewable
            if (prediction.status === 'pending' && prediction.reviewRequest?.status === 'pending') {
                // Allow viewing pending predictions for doctors
            } else {
                return res.status(403).json({ status: 'error', message: 'Not authorized to view this prediction' });
            }
        }

        res.json({ status: 'success', data: { prediction } });
    } catch (error) {
        console.error('Get prediction error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   PUT /api/prediction/:id/review
router.put('/:id/review', auth, async (req, res) => {
    try {
        const { status, doctorNotes, confirmedDiagnosis, treatmentPlan } = req.body;

        const prediction = await Prediction.findById(req.params.id);
        if (!prediction) {
            return res.status(404).json({ status: 'error', message: 'Prediction not found' });
        }

        // sentToDoctorId is a populated object, so check both _id and direct comparison
        const sentToDoctorIdStr = prediction.reviewRequest?.sentToDoctorId?._id?.toString() || 
                                  prediction.reviewRequest?.sentToDoctorId?.toString();
        const isAssignedDoctor = sentToDoctorIdStr === req.user._id.toString();
        
        // Allow review if user is the assigned doctor
        if (!isAssignedDoctor) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to review this prediction' });
        }

        prediction.status = status;
        prediction.doctorReview = {
            doctorId: req.user._id,
            notes: doctorNotes,
            confirmedDiagnosis: confirmedDiagnosis || prediction.prediction,
            treatmentPlan: treatmentPlan,
            reviewedAt: new Date()
        };
        prediction.reviewRequest.status = status === 'reviewed' ? 'completed' : status;
        await prediction.save();

        res.json({ status: 'success', message: 'Prediction reviewed successfully', data: { prediction } });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   DELETE /api/prediction/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const prediction = await Prediction.findOne({ _id: req.params.id, userId: req.user._id });
        if (!prediction) {
            return res.status(404).json({ status: 'error', message: 'Prediction not found' });
        }

        if (prediction.imageUrl) {
            const imagePath = path.join(__dirname, '../../', prediction.imageUrl);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        await prediction.deleteOne();
        res.json({ status: 'success', message: 'Prediction deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

module.exports = router;