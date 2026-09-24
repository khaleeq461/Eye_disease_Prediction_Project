import { Link } from 'react-router-dom';
import { Eye, Scan, FileText, Calendar, Shield, Clock } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Scan,
      title: 'AI-Powered Screening',
      description: 'Upload your eye fundus image and get instant AI analysis for multiple eye conditions.',
      features: ['Diabetic Retinopathy', 'Glaucoma', 'Cataract', 'Myopia']
    },
    {
      icon: FileText,
      title: 'Detailed Reports',
      description: 'Receive comprehensive diagnostic reports with confidence scores and recommendations.',
      features: ['Visual heatmaps', 'Probability scores', 'Expert recommendations', 'PDF export']
    },
    {
      icon: Calendar,
      title: 'Doctor Consultation',
      description: 'Book appointments with certified ophthalmologists for expert review of your results.',
      features: ['Video consultation', 'In-person visits', 'Follow-up scheduling', 'Treatment plans']
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'Your medical data is encrypted and securely stored with strict privacy controls.',
      features: ['End-to-end encryption', 'HIPAA compliant', 'Secure storage', 'Privacy first']
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Access our AI diagnostic services anytime, anywhere from any device.',
      features: ['Instant results', 'No appointments needed', 'Mobile friendly', 'Always available']
    },
    {
      icon: Eye,
      title: 'Eye Health Tracking',
      description: 'Monitor your eye health over time with historical prediction data and trends.',
      features: ['Trend analysis', 'Progress tracking', 'Health insights', 'Reminders']
    }
  ];

  return (
    <div className="py-16">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive AI-powered eye care services designed to help you maintain 
          optimal eye health with early disease detection.
        </p>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <service.icon className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-500">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16 mb-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Pricing Plans</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: 'Basic', 
                price: 'Free',
                features: ['5 scans per month', 'Basic reports', 'Email support', 'History tracking']
              },
              { 
                name: 'Premium', 
                price: '$9.99/mo',
                features: ['Unlimited scans', 'Detailed reports', 'Priority support', 'Doctor consultation', 'PDF exports'],
                popular: true
              },
              { 
                name: 'Family', 
                price: '$19.99/mo',
                features: ['Up to 5 accounts', 'Unlimited scans', 'All Premium features', 'Family health tracking']
              }
            ].map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl p-8 shadow-md ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}>
                {plan.popular && (
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900 mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular 
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'border-2 border-gray-300 hover:border-primary-500'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
        <p className="text-lg text-gray-600 mb-8">
          Sign up today and take control of your eye health.
        </p>
        <Link
          to="/register"
          className="inline-block px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700"
        >
          Create Free Account
        </Link>
      </section>
    </div>
  );
};

export default Services;