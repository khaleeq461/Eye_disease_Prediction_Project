import React from 'react';
import {
  HeartPulse,
  AlertTriangle,
  Stethoscope,
  Microscope,
  Eye,
  Info,
  HelpCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const diseaseExplanations = {
  diabetes: {
    organ: "Pancreas (Blood Sugar & Circulatory System)",
    organBadge: "Endocrine & Blood Vessels",
    icon: HeartPulse,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/20 border-rose-500/40",
    whatSeen: "The AI detected tiny red micro-hemorrhages (blood spots) and fluid exudates around the blood vessels in the retina.",
    whyHappened: "When the pancreas doesn't regulate blood sugar properly, chronic high glucose levels weaken and damage the tiny capillaries in the back of the eye. Over time, these fragile vessels leak small amounts of blood and fluid into the retina.",
    whatToDo: "Schedule an appointment with an eye specialist (ophthalmologist) and work with your physician to keep your blood sugar (HbA1c) and blood pressure well controlled."
  },
  glaucoma: {
    organ: "Eye Fluid Drainage System (Trabecular Meshwork)",
    organBadge: "Internal Eye Pressure",
    icon: Eye,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20 border-purple-500/40",
    whatSeen: "The AI detected enlargement of the central optic nerve cup (increased cup-to-disc ratio) and thinning of the nerve rim.",
    whyHappened: "The eye's natural drainage canals become clogged or restricted, causing intraocular fluid pressure (IOP) to build up inside the eye. This increased pressure puts physical strain on the optic nerve fibers that transmit visual signals to the brain.",
    whatToDo: "Visit an eye doctor for a pressure test (tonometry) and visual field test. Prescription eye drops can effectively lower eye pressure and protect your vision."
  },
  cataract: {
    organ: "Natural Crystalline Eye Lens",
    organBadge: "Optical Lens Clarity",
    icon: Microscope,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20 border-blue-500/40",
    whatSeen: "The AI detected diffuse haziness, reduced optical contrast, and blurring across the retinal image.",
    whyHappened: "Natural proteins inside the eye's crystalline lens denature and clump together over time due to aging, UV sunlight exposure, or metabolic factors. These protein clumps cloud the clear lens, scattering light before it can reach the retina.",
    whatToDo: "Consult an ophthalmologist for a lens examination. If vision is significantly blurred, simple lens replacement surgery (cataract surgery) can restore clear vision."
  },
  myopia: {
    organ: "Eyeball Shape & Sclera (Axial Length)",
    organBadge: "Eye Anatomy & Geometry",
    icon: Eye,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/20 border-amber-500/40",
    whatSeen: "The AI detected retinal tissue thinning and a characteristic pale crescent ring around the edge of the optic nerve.",
    whyHappened: "The eyeball has grown slightly longer from front to back than normal. This extra elongation stretches the delicate retinal and vascular layers at the back of the eye, causing localized tissue thinning.",
    whatToDo: "Get your prescription updated with an optometrist and undergo periodic dilated eye exams to check for peripheral retinal health."
  },
  normal: {
    organ: "Healthy Eye & Body Function",
    organBadge: "Normal Eye Health",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20 border-emerald-500/40",
    whatSeen: "The AI verified clear, healthy retinal blood vessels with sharp optic nerve margins and no signs of bleeding or pressure damage.",
    whyHappened: "Your eye's internal fluid drainage, lens clarity, and retinal blood supply are all operating in balanced, healthy condition with normal blood sugar and pressure levels.",
    whatToDo: "Continue maintaining good eye habits, wear UV-blocking sunglasses outdoors, and schedule a routine checkup every 1 to 2 years."
  }
};

const XAIEtiologyPathway = ({
  prediction = 'normal',
  confidence = 0.95
}) => {
  const predClean = (prediction || 'normal').toLowerCase();
  const info = diseaseExplanations[predClean] || diseaseExplanations.normal;
  const Icon = info.icon;

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-700 shadow-xl p-5 sm:p-6 space-y-5 text-slate-100 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Why Did the AI Detect This?
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
              Medical Explanation
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Plain-language explanation of the root cause, affected organ, and what the AI saw on your scan.
          </p>
        </div>
      </div>

      {/* 2-Card Layout: Affected Organ + What Was Seen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Affected Organ & Origin */}
        <div className="bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${info.iconBg}`}>
              <Icon className={`w-5 h-5 ${info.iconColor}`} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Affected Organ / Root Source</p>
              <h4 className="text-sm sm:text-base font-bold text-white">{info.organ}</h4>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
            {info.whyHappened}
          </p>
        </div>

        {/* What AI Saw on Scan */}
        <div className="bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">What Was Seen on Your Scan</p>
              <h4 className="text-sm sm:text-base font-bold text-white">Visual Indicators</h4>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
            {info.whatSeen}
          </p>
        </div>
      </div>

      {/* Recommended Next Steps Card */}
      <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-800/40 flex items-start space-x-3 text-xs">
        <Stethoscope className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-300 mb-0.5">Recommended Next Steps:</p>
          <p className="text-slate-300 leading-relaxed">{info.whatToDo}</p>
        </div>
      </div>
    </div>
  );
};

export default XAIEtiologyPathway;
