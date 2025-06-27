"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/auth";
import { SubscriptionBox } from "@/components/subscription/SubscriptionComponents";
import { Spinner } from "@/components/ui/spinner";

interface SubscriptionData {
  tier: string;
  status: string;
  maxDigests: number;
  currentCount: number;
  currentPeriodEnd?: string;
  paymentProvider?: string | null;
  paymentCustomerId?: string | null;
  paymentSubscriptionId?: string | null;
}

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/subscriptions", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch subscription data");
      }

      const data = await res.json();
      setSubscription({
        tier: data.tier || "free",
        status: data.status || "active",
        maxDigests: data.maxDigests || 3,
        currentCount: data.currentCount || 0,
        currentPeriodEnd: data.currentPeriodEnd,
        paymentProvider: data.paymentProvider,
        paymentCustomerId: data.paymentCustomerId,
        paymentSubscriptionId: data.paymentSubscriptionId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Default to free tier if there's an error
      setSubscription({
        tier: "free",
        status: "active",
        maxDigests: 3,
        currentCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleUpgrade = async (tier: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // For a real implementation, this would redirect to a payment page
      // For now, we'll simulate an upgrade through the API

      // Prepare the data, possibly from a payment form in a real implementation
      const updateData: {
        tier: string;
        paymentProvider?: string;
        paymentCustomerId?: string;
        paymentSubscriptionId?: string;
        paymentData?: object;
      } = {
        tier: tier,
      };

      // In a real implementation, these values would come from the payment provider's response
      // Here we're just preserving any existing payment info or could set new values
      if (subscription?.paymentProvider) {
        updateData.paymentProvider = subscription.paymentProvider;
      }
      if (subscription?.paymentCustomerId) {
        updateData.paymentCustomerId = subscription.paymentCustomerId;
      }
      if (subscription?.paymentSubscriptionId) {
        updateData.paymentSubscriptionId = subscription.paymentSubscriptionId;
      }

      const { addCsrfHeaders } = await import("@/lib/csrf-client");
      const res = await fetch(
        "/api/subscriptions/update",
        addCsrfHeaders({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(updateData),
        }),
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update subscription");
      }

      // Refresh subscription data after upgrade
      await fetchSubscriptionData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during upgrade",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {subscription && (
        <>
          <div className="bg-white rounded-lg shadow p-6 border mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <p>
                  <span className="font-medium">Plan:</span>{" "}
                  <span className="capitalize">{subscription.tier}</span>
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{subscription.status}</span>
                </p>
                <p>
                  <span className="font-medium">Scheduled Digests:</span>{" "}
                  {subscription.currentCount} /
                  {subscription.maxDigests === -1
                    ? "Unlimited"
                    : subscription.maxDigests}
                </p>
                {subscription.currentPeriodEnd && (
                  <p>
                    <span className="font-medium">Next Billing Date:</span>{" "}
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                )}
                {subscription.paymentProvider && (
                  <p>
                    <span className="font-medium">Payment Provider:</span>{" "}
                    <span className="capitalize">
                      {subscription.paymentProvider}
                    </span>
                  </p>
                )}
              </div>
              <div className="mt-4 md:mt-0">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="mr-2"
                >
                  Back to Dashboard
                </Button>
                <Button onClick={() => fetchSubscriptionData()}>Refresh</Button>
              </div>
            </div>
          </div>

          <SubscriptionBox
            currentTier={subscription.tier}
            maxDigests={subscription.maxDigests}
            currentCount={subscription.currentCount}
            onUpgrade={handleUpgrade}
          />
        </>
      )}

      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
        <p>
          If you have any questions about billing or your subscription, please
          contact our support team at{" "}
          <a
            href="mailto:knockanapp@gmail.com"
            className="text-blue-600 hover:underline"
          >
            knockanapp@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
