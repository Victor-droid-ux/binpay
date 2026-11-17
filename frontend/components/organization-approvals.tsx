"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi } from "@/lib/api";
import { ACCOUNT_TYPES } from "@/lib/account-types";

const STATUS_FILTERS = ["PENDING", "APPROVED", "REJECTED"] as const;

export function OrganizationApprovals({ stateCode }: { stateCode: string }) {
  const [status, setStatus] =
    useState<(typeof STATUS_FILTERS)[number]>("PENDING");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stateCode) return;
    setIsLoading(true);
    try {
      const res = await adminApi.getOrganizations(stateCode, status);
      setOrganizations(res.organizations || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load organisations");
    } finally {
      setIsLoading(false);
    }
  }, [stateCode, status]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await adminApi.approveOrganization(id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to approve organisation");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    if (!reason.trim()) {
      setError("Enter a reason for rejecting this organisation");
      return;
    }
    setBusyId(id);
    try {
      await adminApi.rejectOrganization(id, reason.trim());
      setRejectingId(null);
      setReason("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to reject organisation");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation Accounts</CardTitle>
        <CardDescription>
          Schools, industries and institutions are billed only after approval.
          Check the CAC / registration number before approving.
        </CardDescription>
        <div className="flex gap-2 pt-2">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              onClick={() => setStatus(s)}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : organizations.length === 0 ? (
          <p className="text-sm text-gray-500">
            No {status.toLowerCase()} organisations.
          </p>
        ) : (
          organizations.map((org) => {
            const type = ACCOUNT_TYPES.find((t) => t.value === org.accountType);
            return (
              <div key={org._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {org.organizationName || org.firstName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {type?.label} (
                      {org.organizationCategory?.replace(/_/g, " ")})
                      {type &&
                        ` - \u20a6${type.amount.toLocaleString()}/bin/month`}
                    </p>
                  </div>
                  <Badge variant="secondary">{org.approvalStatus}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="text-gray-500">RC number:</span>{" "}
                    <span className="font-mono">{org.registrationNumber}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Declared bins:</span>{" "}
                    {org.numberOfBins}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span> {org.email}
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span> {org.phone}
                  </p>
                  <p>
                    <span className="text-gray-500">Contact:</span>{" "}
                    {org.contactPersonName} ({org.contactPersonPhone})
                  </p>
                  <p>
                    <span className="text-gray-500">Registered:</span>{" "}
                    {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {org.approvalStatus === "REJECTED" && org.approvalNote && (
                  <p className="text-sm text-red-700">
                    Rejected: {org.approvalNote}
                  </p>
                )}

                {rejectingId === org._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for rejection (sent to the organisation)"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === org._id}
                        onClick={() => reject(org._id)}
                      >
                        Confirm rejection
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {org.approvalStatus !== "APPROVED" && (
                      <Button
                        size="sm"
                        disabled={busyId === org._id}
                        onClick={() => approve(org._id)}
                      >
                        Approve
                      </Button>
                    )}
                    {org.approvalStatus !== "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingId(org._id)}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
