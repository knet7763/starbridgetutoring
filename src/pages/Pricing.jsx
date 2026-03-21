import React from 'react';
import Button from '../components/Button';
import { Check } from 'lucide-react';

const Pricing = () => {
    const plans = [
        {
            name: 'Starter Package',
            price: '$40',
            period: '/month',
            classes: '2 classes per week',
            features: ['2 classes per week', 'Free trial included', 'Free learning materials', 'Progress reports'],
            cta: 'Choose Starter',
            variant: 'outline',
        },
        {
            name: 'Standard Package',
            price: '$75',
            period: '/month',
            classes: '4 classes per week',
            features: ['4 classes per week', 'Free trial included', 'Free learning materials', 'Progress reports', 'Priority scheduling'],
            cta: 'Choose Standard',
            variant: 'primary',
            popular: true,
        },
        {
            name: 'Premium Package',
            price: '$150',
            period: '/month',
            classes: '8 classes per week',
            features: ['8 classes per week', 'Free trial included', 'Free learning materials', 'Weekly progress reports', 'Dedicated support'],
            cta: 'Choose Premium',
            variant: 'outline',
        },
    ];

    return (
        <div className="bg-white py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Pricing Plans</h1>
                    <p className="text-xl text-gray-600">Invest in your child's future with affordable, high-quality tutoring.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col p-8 bg-white rounded-2xl border ${plan.popular ? 'border-primary shadow-2xl scale-105 z-10' : 'border-gray-200 shadow-lg'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2">
                                    <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-primary text-white">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">{plan.name}</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-5xl font-extrabold tracking-tight text-gray-900">{plan.price}</span>
                                <span className="ml-1 text-xl font-medium text-gray-500">{plan.period}</span>
                            </div>
                            <p className="text-gray-500 mb-6">{plan.classes}</p>
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="flex-shrink-0 h-6 w-6 text-green-500" />
                                        <span className="ml-3 text-base text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button to="/book-trial" variant={plan.variant} className="w-full justify-center">
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center text-gray-600">
                    <p className="mb-4">Need even more? <strong>Premium Plus:</strong> $220/month for 12 classes (3 per week).</p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
