"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@heroicons/react/24/outline";

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  popular?: boolean;
  current?: boolean;
}

interface SubscriptionBoxProps {
  currentTier: string;
  maxDigests: number;
  currentCount: number;
  onUpgrade: (tier: string) => void;
}

export function SubscriptionBox({
  currentTier,
  maxDigests,
  currentCount,
  onUpgrade,
}: SubscriptionBoxProps) {
  const [isLoading, setIsLoading] = useState(false);

  const tiers: PricingTier[] = [
    {
      name: "Free",
      price: "$0",
      description: "Basic features for personal use",
      current: currentTier === "free",
      features: [
        { name: "3 scheduled digests", included: true },
        { name: "Daily or weekly frequency", included: true },
        { name: "Basic email templates", included: true },
        { name: "Standard support", included: true },
        { name: "Custom templates", included: false },
        { name: "Monthly frequency", included: false },
      ],
      buttonText: currentTier === "free" ? "Current Plan" : "Downgrade",
    },
    {
      name: "Pro",
      price: "$9.99",
      description: "Everything in Free plus more features",
      popular: true,
      current: currentTier === "pro",
      features: [
        { name: "15 scheduled digests", included: true },
        { name: "All frequency options", included: true },
        { name: "Custom email templates", included: true },
        { name: "Priority support", included: true },
        { name: "Advanced filtering", included: false },
        { name: "API access", included: false },
      ],
      buttonText:
        currentTier === "pro"
          ? "Current Plan"
          : currentTier === "enterprise"
            ? "Downgrade"
            : "Upgrade",
    },
    {
      name: "Enterprise",
      price: "$29.99",
      description: "Advanced features for power users",
      current: currentTier === "enterprise",
      features: [
        { name: "Unlimited digests", included: true },
        { name: "All frequency options", included: true },
        { name: "Custom templates", included: true },
        { name: "Priority support", included: true },
        { name: "Advanced filtering", included: true },
        { name: "API access", included: true },
      ],
      buttonText: currentTier === "enterprise" ? "Current Plan" : "Upgrade",
    },
  ];

  const handleUpgrade = async (tier: string) => {
    setIsLoading(true);
    try {
      await onUpgrade(tier);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 my-8 border">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Subscription Plans</h2>
        <p className="text-gray-600">Choose the plan that fits your needs</p>
        {maxDigests !== -1 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-sm">
              You&apos;re using <strong>{currentCount}</strong> of your{" "}
              <strong>{maxDigests}</strong> scheduled digests
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.min((currentCount / maxDigests) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`flex flex-col border rounded-lg overflow-hidden ${
              tier.popular
                ? "border-blue-500 shadow-lg scale-105 z-10"
                : "border-gray-200"
            } ${tier.current ? "ring-2 ring-blue-500" : ""}`}
          >
            {tier.popular && (
              <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                Most Popular
              </div>
            )}
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className="text-gray-600"> / month</span>
              </div>
              <p className="text-gray-600 mb-6">{tier.description}</p>
              <div className="space-y-3 mb-6 flex-grow">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <span className="h-5 w-5 text-gray-300 mr-2">✕</span>
                    )}
                    <span
                      className={
                        feature.included ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                variant={
                  tier.current
                    ? "outline"
                    : tier.popular
                      ? "default"
                      : "outline"
                }
                disabled={tier.current || isLoading}
                className="w-full"
                onClick={() => handleUpgrade(tier.name.toLowerCase())}
              >
                {isLoading ? "Processing..." : tier.buttonText}
              </Button>
              {tier.current && (
                <p className="text-sm text-center mt-2 text-blue-600">
                  Your current plan
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SubscriptionBanner({
  tierLimit,
  currentCount,
  maxDigests,
  onUpgrade,
}: {
  tierLimit: boolean;
  currentCount: number;
  maxDigests: number;
  onUpgrade: () => void;
}) {
  if (!tierLimit) return null;

  const percentUsed = (currentCount / maxDigests) * 100;

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-blue-800">
            You&apos;ve used {currentCount} of {maxDigests} scheduled digests
          </h3>
          <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 my-2">
            <div
              className={`h-2 rounded-full ${
                percentUsed > 90 ? "bg-red-500" : "bg-blue-600"
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Upgrade to get more scheduled digests and additional features
          </p>
        </div>
        <Button onClick={onUpgrade} className="whitespace-nowrap">
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
}
