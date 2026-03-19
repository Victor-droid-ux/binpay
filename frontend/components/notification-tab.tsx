"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, X, Loader2 } from "lucide-react";

export function NotificationTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await adminApi.getNotifications();
      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : [],
      );
      setError(null);
    } catch (err: any) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Resolve the MongoDB _id of the BinRegistration document.
  // New notifications store it as metadata.addressId.
  // Old notifications only had metadata.binId — fall back to an API lookup.
  const resolveAddressId = async (
    notification: any,
  ): Promise<string | null> => {
    const meta = notification.metadata || {};

    // Best case: addressId stored directly (new notifications)
    if (meta.addressId) {
      return meta.addressId;
    }

    // Fallback: look up the document by binId (old notifications)
    if (meta.binId) {
      try {
        const result = await adminApi.getAddressByBinId(meta.binId);
        return result?.address?._id || result?._id || null;
      } catch (err) {
        console.error("Failed to resolve addressId from binId:", err);
        return null;
      }
    }

    return null;
  };

  const handleApprove = async (notification: any) => {
    try {
      setActionLoading(notification._id + "_approve");
      setError(null);

      const addressId = await resolveAddressId(notification);

      if (!addressId) {
        setError(
          "Cannot approve: could not find the address record. It may have already been processed or use the Addresses tab instead.",
        );
        return;
      }

      await adminApi.approveAddress(addressId);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id
            ? {
                ...n,
                type: "ADDRESS_APPROVED",
                title: "Address Approved",
                message: `Address approved. Bin ID: ${notification.metadata?.binId || "assigned"}`,
              }
            : n,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to approve address");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (notification: any) => {
    if (
      !confirm("Are you sure you want to reject this address registration?")
    ) {
      return;
    }
    try {
      setActionLoading(notification._id + "_reject");
      setError(null);

      const addressId = await resolveAddressId(notification);

      if (!addressId) {
        setError(
          "Cannot reject: could not find the address record. It may have already been processed or use the Addresses tab instead.",
        );
        return;
      }

      await adminApi.rejectAddress(addressId);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id
            ? {
                ...n,
                type: "ADDRESS_REJECTED",
                title: "Address Rejected",
                message: "Address registration has been rejected.",
              }
            : n,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to reject address");
    } finally {
      setActionLoading(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={fetchNotifications}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n: any) => (
            <li
              key={n._id}
              className={`border rounded-lg p-4 transition-colors ${
                n.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {n.title}
                    </span>
                    {n.type === "ADDRESS_REGISTRATION" && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                        Pending Approval
                      </Badge>
                    )}
                    {n.type === "ADDRESS_APPROVED" && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        Approved
                      </Badge>
                    )}
                    {n.type === "ADDRESS_REJECTED" && (
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                        Rejected
                      </Badge>
                    )}
                    {n.type === "BIN_FULL" && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        Bin Full
                      </Badge>
                    )}
                    {n.type === "OVERDUE_BILL" && (
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-700">{n.message}</p>

                  {n.type === "ADDRESS_REGISTRATION" && n.metadata && (
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5 bg-gray-50 p-2 rounded">
                      {n.metadata.address && (
                        <p>
                          <span className="font-medium">Address:</span>{" "}
                          {n.metadata.address}
                        </p>
                      )}
                      {n.metadata.lgaName && (
                        <p>
                          <span className="font-medium">LGA:</span>{" "}
                          {n.metadata.lgaName}
                        </p>
                      )}
                      {n.metadata.binId && (
                        <p>
                          <span className="font-medium">Bin ID:</span>{" "}
                          {n.metadata.binId}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>

                {n.type === "ADDRESS_REGISTRATION" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(n)}
                      disabled={
                        actionLoading === n._id + "_approve" ||
                        actionLoading === n._id + "_reject"
                      }
                    >
                      {actionLoading === n._id + "_approve" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleReject(n)}
                      disabled={
                        actionLoading === n._id + "_approve" ||
                        actionLoading === n._id + "_reject"
                      }
                    >
                      {actionLoading === n._id + "_reject" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
