const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

// Disease classes for the disease model
const DISEASE_CLASSES = ['diabetes', 'glaucoma', 'cataract', 'myopia'];
const ALL_CLASSES = ['normal', 'diabetes', 'glaucoma', 'cataract', 'myopia'];
const IMG_SIZE = 300;

// Image preprocessing
const preprocessImage = (imgBuffer) => {
    // Decode image
    const imageTensor = tf.node.decodeImage(imgBuffer, 3);
    
    // Resize to 300x300
    const resized = tf.image.resizeBilinear(imageTensor, [IMG_SIZE, IMG_SIZE]);
    
    // Normalize (ImageNet normalization)
    const normalized = resized.div(255.0);
    
    // Apply ImageNet mean/std
    const mean = tf.tensor([0.485, 0.456, 0.406]);
    const std = tf.tensor([0.229, 0.224, 0.225]);
    const normalized2 = normalized.sub(mean).div(std);
    
    // Add batch dimension
    const batched = normalized2.expandDims(0);
    
    // Cleanup
    imageTensor.dispose();
    resized.dispose();
    normalized.dispose();
    mean.dispose();
    std.dispose();
    
    return batched;
};

// Load models (lazy loading)
let binaryModel = null;
let diseaseModel = null;

const loadBinaryModel = async () => {
    if (binaryModel) return binaryModel;
    
    try {
        const modelPath = path.join(__dirname, '../../models/binary_FINAL.pth');
        // Since .pth is PyTorch, we'll use TensorFlow.js converted version
        const tfModelPath = path.join(__dirname, '../../models/binary_FINAL');
        
        if (fs.existsSync(tfModelPath)) {
            binaryModel = await tf.loadLayersModel(`file://${tfModelPath}/model.json`);
            console.log('Binary model loaded successfully');
        } else {
            console.warn('Binary model not found at:', tfModelPath);
        }
    } catch (error) {
        console.error('Error loading binary model:', error);
    }
    
    return binaryModel;
};

const loadDiseaseModel = async () => {
    if (diseaseModel) return diseaseModel;
    
    try {
        const tfModelPath = path.join(__dirname, '../../models/disease_FINAL');
        
        if (fs.existsSync(tfModelPath)) {
            diseaseModel = await tf.loadLayersModel(`file://${tfModelPath}/model.json`);
            console.log('Disease model loaded successfully');
        } else {
            console.warn('Disease model not found at:', tfModelPath);
        }
    } catch (error) {
        console.error('Error loading disease model:', error);
    }
    
    return diseaseModel;
};

// Prediction with confidence threshold
const CONFIDENCE_THRESHOLD = 0.7;

const predict = async (imageBuffer) => {
    try {
        // Preprocess image
        const inputTensor = preprocessImage(imageBuffer);
        
        // Load models if not loaded
        const binary = await loadBinaryModel();
        const disease = await loadDiseaseModel();
        
        if (!binary || !disease) {
            throw new Error('Models not loaded. Please ensure models are converted to TensorFlow.js format.');
        }
        
        // Step 1: Binary classification (Normal vs Disease)
        const binaryOutput = binary.predict(inputTensor);
        const binaryProb = binaryOutput.dataSync();
        
        // Binary: [normal_prob, disease_prob]
        const normalProb = binaryProb[0];
        const diseaseProb = binaryProb[1];
        const binaryPred = normalProb > diseaseProb ? 0 : 1;
        
        // Cleanup
        binaryOutput.dispose();
        
        let result = {
            isNormal: binaryPred === 0,
            binaryResult: {
                isNormal: binaryPred === 0,
                normalProbability: normalProb,
                diseaseProbability: diseaseProb
            }
        };
        
        // Step 2: If disease detected, classify disease type
        if (binaryPred === 1) {
            const diseaseOutput = disease.predict(inputTensor);
            const diseaseProbabilities = diseaseOutput.dataSync();
            
            // Find max probability
            let maxProb = 0;
            let predictedDisease = 0;
            
            for (let i = 0; i < diseaseProbabilities.length; i++) {
                if (diseaseProbabilities[i] > maxProb) {
                    maxProb = diseaseProbabilities[i];
                    predictedDisease = i;
                }
            }
            
            result.diseaseResult = {
                disease: DISEASE_CLASSES[predictedDisease],
                confidence: maxProb,
                probabilities: {
                    diabetes: diseaseProbabilities[0],
                    glaucoma: diseaseProbabilities[1],
                    cataract: diseaseProbabilities[2],
                    myopia: diseaseProbabilities[3]
                }
            };
            
            // Check confidence threshold
            if (maxProb < CONFIDENCE_THRESHOLD) {
                result.isAccepted = false;
                result.rejectedReason = 'Low confidence prediction - may not be a valid eye image or condition unclear';
            } else {
                result.isAccepted = true;
            }
            
            // Cleanup
            diseaseOutput.dispose();
        } else {
            result.isAccepted = normalProb >= 0.5;
        }
        
        // Cleanup input tensor
        inputTensor.dispose();
        
        return result;
        
    } catch (error) {
        console.error('Prediction error:', error);
        throw error;
    }
};

// Get recommendations based on prediction
const getRecommendations = (prediction, confidence) => {
    const recommendations = {
        normal: {
            title: 'Healthy Eyes',
            descriptions: [
                'Continue maintaining good eye health habits',
                'Schedule regular eye check-ups every 1-2 years',
                'Protect your eyes from UV light with sunglasses',
                'Take regular breaks from screen time',
                'Eat a balanced diet rich in vitamins A, C, and E'
            ],
            priority: 'low'
        },
        diabetes: {
            title: 'Diabetic Retinopathy Detected',
            descriptions: [
                'Consult an ophthalmologist immediately',
                'Control blood sugar levels strictly',
                'Monitor blood pressure and cholesterol',
                'Schedule regular retinal examinations',
                'Consider laser treatment or injections if recommended',
                'Avoid smoking and maintain a healthy weight'
            ],
            priority: 'high'
        },
        glaucoma: {
            title: 'Glaucoma Detected',
            descriptions: [
                'Seek immediate specialist consultation',
                'Medication to lower eye pressure may be required',
                'Regular monitoring of intraocular pressure',
                'Avoid activities that increase eye pressure',
                'Surgery may be necessary in advanced cases',
                'Family members should also get tested'
            ],
            priority: 'high'
        },
        cataract: {
            title: 'Cataract Detected',
            descriptions: [
                'Consult an ophthalmologist for evaluation',
                'Surgery is the only effective treatment',
                'Consider lens replacement surgery',
                'Use brighter lighting for better vision',
                'Update eyeglass prescription regularly',
                'Monitor for any sudden vision changes'
            ],
            priority: 'medium'
        },
        myopia: {
            title: 'Myopia (Nearsightedness) Detected',
            descriptions: [
                'Consult an optometrist for correction options',
                'Consider corrective lenses or surgery',
                'Reduce screen time and near work',
                'Spend more time outdoors',
                'Regular eye examinations to monitor progression',
                'Consider orthokeratology lenses'
            ],
            priority: 'medium'
        }
    };
    
    return recommendations[prediction] || recommendations.normal;
};

// Cleanup models from memory
const cleanup = () => {
    if (binaryModel) {
        binaryModel.dispose();
        binaryModel = null;
    }
    if (diseaseModel) {
        diseaseModel.dispose();
        diseaseModel = null;
    }
};

module.exports = {
    predict,
    loadBinaryModel,
    loadDiseaseModel,
    getRecommendations,
    cleanup,
    ALL_CLASSES,
    DISEASE_CLASSES
};