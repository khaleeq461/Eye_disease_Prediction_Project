import { Link } from 'react-router-dom';
import { Brain, Users, Award, Heart, Target, Eye, Shield, ArrowRight, GraduationCap } from 'lucide-react';

const About = () => {
  const stats = [
    { value: '94%', label: 'Detection Accuracy', icon: Target },
    { value: '10K+', label: 'Images Analyzed', icon: Eye },
    { value: '5+', label: 'Disease Classes', icon: Brain },
    { value: '24/7', label: 'Availability', icon: Shield },
  ];

  const values = [
    {
      icon: Eye,
      title: 'Early Detection',
      description: 'We believe in catching eye diseases at their earliest stage when treatment is most effective.'
    },
    {
      icon: Users,
      title: 'Accessibility',
      description: 'Making quality eye care available to everyone, regardless of their location or resources.'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your health data is encrypted and protected with the highest security standards.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We continuously improve our models to maintain the highest accuracy standards.'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-24 lg:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-500/20 backdrop-blur-sm rounded-full border border-sky-500/30 mb-6">
            <Brain className="h-5 w-5 text-sky-400" />
            <span className="text-sky-300 text-sm font-medium">About Our Technology</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            About <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">AI-Powered Eye Care</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            We are dedicated to revolutionizing eye disease detection through the power of
            artificial intelligence and machine learning, making quality healthcare accessible to everyone.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-12 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-sky-600 to-blue-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Our Mission</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-6">
                Making Eye Care<br />Accessible to All
              </h2>
              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  Early detection saves vision. Our mission is to make eye disease screening
                  accessible to everyone through AI-powered technology. We believe that
                  combining medical expertise with artificial intelligence can help prevent
                  blindness and improve quality of life for millions worldwide.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Our deep learning models are trained on thousands of fundus images to
                  accurately detect and classify multiple eye conditions, enabling timely
                  intervention and treatment when it matters most.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link
                    to="/register"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* AI Card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">EfficientNet-B3 Architecture</h3>
                <p className="text-gray-400 mb-6">
                  Our models use state-of-the-art EfficientNet-B3 architecture, fine-tuned
                  on a comprehensive dataset of eye fundus images.
                </p>
                <div className="space-y-3">
                  {['Diabetic Retinopathy Detection', 'Glaucoma Screening', 'Cataract Assessment', 'Myopia Evaluation'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-sm">✓</span>
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Our Values</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3">
              What Drives Us Forward
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="group text-center p-8 rounded-2xl border border-gray-200 hover:border-sky-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <value.icon className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Our Team</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3">
              Meet the Minds Behind the Vision
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {/* Developer 1 - Ahmad Jawad */}
            {/* <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ahmad Jawad</h3>
              <p className="text-sky-600 font-semibold mb-4">Lead Developer</p>
              <p className="text-gray-600 text-sm">
                Full-stack developer specializing in AI/ML integration and healthcare applications. 
                Built the complete system architecture and machine learning pipeline.
              </p>
              <div className="mt-6 flex justify-center flex-wrap gap-2">
                <div className="px-3 py-1 bg-sky-50 rounded-lg">
                  <p className="text-xs text-sky-600 font-medium">React</p>
                </div>
                <div className="px-3 py-1 bg-sky-50 rounded-lg">
                  <p className="text-xs text-sky-600 font-medium">Node.js</p>
                </div>
                <div className="px-3 py-1 bg-sky-50 rounded-lg">
                  <p className="text-xs text-sky-600 font-medium">PyTorch</p>
                </div>
              </div>
            </div> */}

            {/* Developer 2 - Khaleeq Ur Rehman */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Khaleeq Ur Rehman</h3>
              <p className="text-teal-600 font-semibold mb-4">Developer</p>
              <p className="text-gray-600 text-sm">
                Full-stack developer specializing in AI/ML integration and healthcare applications.
                Software developer contributing to system development, feature implementation,
                and ensuring robust backend functionality.
              </p>

              <div className="mt-6 flex justify-center flex-wrap gap-2">
                <div className="px-3 py-1 bg-teal-50 rounded-lg">
                  <p className="text-xs text-teal-600 font-medium">AI/ML</p>
                </div>
                <div className="px-3 py-1 bg-teal-50 rounded-lg">
                  <p className="text-xs text-teal-600 font-medium">JavaScript</p>
                </div>
                <div className="px-3 py-1 bg-teal-50 rounded-lg">
                  <p className="text-xs text-teal-600 font-medium">Python</p>
                </div>
                <div className="px-3 py-1 bg-teal-50 rounded-lg">
                  <p className="text-xs text-teal-600 font-medium">SQL</p>
                </div>
              </div>
            </div>

            {/* Supervisor - Row 2 spans full width */}
          </div>
        </div>
      </section>

      {/* Supervisor Section - Second Row */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sky-600 font-semibold text-sm uppercase tracking-wider">Project Supervision</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Under Expert Guidance
            </h2>
          </div>

          <div className="max-w-md mx-auto">
            {/* Supervisor */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Shoaib Quraishi</h3>
              <p className="text-purple-600 font-semibold mb-4">Project Supervisor</p>
              <p className="text-gray-600">
                Medical expert providing guidance on clinical requirements, data validation,
                and ensuring the system meets healthcare standards and best practices.
              </p>
              <div className="mt-6 flex justify-center flex-wrap gap-2">
                <div className="px-4 py-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Ophthalmology</p>
                </div>
                <div className="px-4 py-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Research</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-16 h-16 mx-auto mb-8 opacity-90" />
          <h2 className="text-4xl font-bold mb-6">
            Join Us in Saving Vision
          </h2>
          <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto">
            Help us make quality eye care accessible to everyone. Start your free
            screening today and take control of your eye health.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-3 px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:bg-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;