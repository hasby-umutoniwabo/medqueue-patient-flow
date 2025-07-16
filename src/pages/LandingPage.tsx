import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const features = [
        {
            icon: 'fas fa-clock',
            title: 'Real-time Queue Management',
            description: 'Track your position in the queue and get real-time updates on wait times.'
        },
        {
            icon: 'fas fa-mobile-alt',
            title: 'Mobile-First Design',
            description: 'Access MedQueue from any device with our responsive, mobile-optimized interface.'
        },
        {
            icon: 'fas fa-user-md',
            title: 'Healthcare Provider Dashboard',
            description: 'Comprehensive tools for healthcare providers to manage patient queues efficiently.'
        },
        {
            icon: 'fas fa-bell',
            title: 'Smart Notifications',
            description: 'Get notified when it\'s almost your turn, reducing wait times and improving experience.'
        },
        {
            icon: 'fas fa-chart-line',
            title: 'Analytics & Insights',
            description: 'Detailed analytics help healthcare facilities optimize their operations.'
        },
        {
            icon: 'fas fa-shield-alt',
            title: 'Secure & Private',
            description: 'Your medical information is protected with enterprise-grade security measures.'
        }
    ];

    const testimonials = [
        {
            name: 'Dr. Sarah Johnson',
            role: 'Chief Medical Officer',
            hospital: 'Kigali Central Hospital',
            comment: 'MedQueue has revolutionized how we manage patient flow. Our efficiency has improved by 40%.',
            avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&crop=face'
        },
        {
            name: 'James Mukamana',
            role: 'Patient',
            hospital: 'King Faisal Hospital',
            comment: 'No more long waits! I can track my position and arrive at the perfect time.',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face'
        },
        {
            name: 'Dr. Marie Uwimana',
            role: 'Department Head',
            hospital: 'University Teaching Hospital',
            comment: 'The analytics feature helps us identify peak hours and optimize our staffing.',
            avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=64&h=64&fit=crop&crop=face'
        }
    ];

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-white shadow-lg fixed w-full z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold gradient-text">
                                <i className="fas fa-hospital-user mr-2"></i>
                                MedQueue
                            </h1>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-blue-600 transition-colors">Features</button>
                            <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-blue-600 transition-colors">About</button>
                            <button onClick={() => scrollToSection('testimonials')} className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</button>
                            <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-blue-600 transition-colors">Contact</button>
                        </div>
                        <div className="flex">
                            <button 
                                onClick={() => navigate('/index')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-bg text-white pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="slide-in-left">
                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                                Revolutionize Your
                                <span className="block text-yellow-300">Healthcare Experience</span>
                            </h1>
                            <p className="text-xl text-gray-100 mb-8 leading-relaxed">
                                Skip the waiting room chaos. MedQueue brings smart queue management to healthcare, 
                                making appointments efficient for patients and providers alike.
                            </p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <button 
                                    onClick={() => navigate('/index')}
                                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"
                                >
                                    <i className="fas fa-rocket mr-2"></i>
                                    Get Started
                                </button>
                                <button 
                                    onClick={() => scrollToSection('features')}
                                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
                                >
                                    <i className="fas fa-play mr-2"></i>
                                    See How It Works
                                </button>
                            </div>
                        </div>
                        <div className="slide-in-right">
                            <div className="relative">
                                <div className="floating">
                                    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">
                                                <i className="fas fa-hospital text-yellow-300"></i>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2">Smart Queue System</h3>
                                            <p className="text-gray-200">Real-time updates • Zero waiting • Better care</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 fade-in">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Choose MedQueue?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our comprehensive platform addresses every aspect of healthcare queue management, 
                            from patient experience to operational efficiency.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white rounded-xl p-8 shadow-lg card-hover fade-in" 
                                 style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="text-4xl feature-icon mb-6">
                                    <i className={feature.icon}></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="slide-in-left">
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Transforming Healthcare in Rwanda
                            </h2>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                MedQueue was built specifically for the Rwandan healthcare system, understanding 
                                the unique challenges faced by both patients and healthcare providers in our country.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-2 rounded-lg mr-4">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <span className="text-gray-700">Reduces average wait time by 60%</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-2 rounded-lg mr-4">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <span className="text-gray-700">Supports Kinyarwanda, English, and French</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-2 rounded-lg mr-4">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <span className="text-gray-700">Works on any mobile device</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-2 rounded-lg mr-4">
                                        <i className="fas fa-check text-green-600"></i>
                                    </div>
                                    <span className="text-gray-700">Compliant with healthcare regulations</span>
                                </div>
                            </div>
                        </div>
                        <div className="slide-in-right">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">500+</div>
                                        <div className="text-blue-100">Patients Served Daily</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">25+</div>
                                        <div className="text-blue-100">Healthcare Facilities</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">95%</div>
                                        <div className="text-blue-100">Satisfaction Rate</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">60%</div>
                                        <div className="text-blue-100">Time Reduction</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            What Our Users Say
                        </h2>
                        <p className="text-xl text-gray-600">
                            Real feedback from healthcare providers and patients across Rwanda
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white rounded-xl p-8 shadow-lg card-hover">
                                <div className="flex items-center mb-6">
                                    <img 
                                        src={testimonial.avatar} 
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full mr-4"
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                            const fallback = img.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4" style={{display: 'none'}}>
                                        <i className="fas fa-user text-blue-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                                        <p className="text-sm text-blue-600">{testimonial.hospital}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 italic leading-relaxed">
                                    "{testimonial.comment}"
                                </p>
                                <div className="flex text-yellow-400 mt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className="fas fa-star"></i>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 gradient-bg text-white">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold mb-6">
                        Ready to Transform Your Healthcare Experience?
                    </h2>
                    <p className="text-xl text-gray-100 mb-8">
                        Join thousands of patients and healthcare providers who have already 
                        revolutionized their queue management with MedQueue.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center">
                        <button 
                            onClick={() => navigate('/index')}
                            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"
                        >
                            <i className="fas fa-user-plus mr-2"></i>
                            Get Started
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-2xl font-bold mb-4">
                                <i className="fas fa-hospital-user mr-2"></i>
                                MedQueue
                            </h3>
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Revolutionizing healthcare queue management in Rwanda through smart, 
                                efficient, and patient-centered technology solutions.
                            </p>
                            <div className="flex space-x-4">
                                <button className="text-gray-400 hover:text-white transition-colors">
                                    <i className="fab fa-facebook-f text-xl"></i>
                                </button>
                                <button className="text-gray-400 hover:text-white transition-colors">
                                    <i className="fab fa-twitter text-xl"></i>
                                </button>
                                <button className="text-gray-400 hover:text-white transition-colors">
                                    <i className="fab fa-linkedin-in text-xl"></i>
                                </button>
                                <button className="text-gray-400 hover:text-white transition-colors">
                                    <i className="fab fa-instagram text-xl"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About</button></li>
                                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Testimonials</button></li>
                                <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
                                <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold mb-4">Contact Info</h4>
                            <ul className="space-y-2 text-gray-300">
                                <li>
                                    <i className="fas fa-envelope mr-2"></i>
                                    support@medqueue.rw
                                </li>
                                <li>
                                    <i className="fas fa-phone mr-2"></i>
                                    +250 788 123 456
                                </li>
                                <li>
                                    <i className="fas fa-map-marker-alt mr-2"></i>
                                    Kigali, Rwanda
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 MedQueue. All rights reserved. Built with ❤️ in Rwanda.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
