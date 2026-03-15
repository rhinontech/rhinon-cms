"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Lead {
    _id: string;
    name: string;
    email: string;
    whatsapp?: string;
    message: string;
    service?: string;
    company?: string;
    createdAt: string;
}

// Metadata cannot be exported from a Client Component like this in the same file if using "use client"
// But since we need "use client" for hooks, we have to rely on layout or external metadata file,
// OR since it's a client component, we might not get server-side metadata injection the same way.
// HOWEVER, "robots.ts" handles the global rule for /admin.
// I will remove the metadata export attempt here since it will cause an error in a "use client" file 
// if not handled carefully, and rely on `robots.ts` which I already created to disallow /admin.

export default function AdminDashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchLeads();
        document.title = "Admin Dashboard"; // Client-side fallback
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch("/api/leads");
            if (res.status === 401) {
                router.push("/admin/login");
                return;
            }
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the lead from "${name}"? This action cannot be undone.`)) {
            return;
        }

        setDeleting(id);
        try {
            const res = await fetch(`/api/leads?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                // Remove from UI immediately
                setLeads(leads.filter(lead => lead._id !== id));
            } else {
                alert("Failed to delete lead. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting lead:", error);
            alert("An error occurred while deleting the lead.");
        } finally {
            setDeleting(null);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-10 pt-28">
            <div className="flex justify-between items-center mb-10 max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold">Admin Dashboard - Leads</h1>
                <Button onClick={handleLogout}>
                    Logout
                </Button>
            </div>

            <div className="max-w-6xl mx-auto overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-700">
                            <th className="p-4">Date</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">WhatsApp</th>
                            <th className="p-4">Company</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => (
                            <tr
                                key={lead._id}
                                className="border-b border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors"
                                onClick={() => setSelectedLead(lead)}
                            >
                                <td className="p-4 text-zinc-400">
                                    {new Date(lead.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 font-medium">{lead.name}</td>
                                <td className="p-4 text-zinc-300">{lead.whatsapp || "-"}</td>
                                <td className="p-4 text-zinc-300">{lead.company || "-"}</td>
                                <td className="p-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(lead._id, lead.name);
                                        }}
                                        disabled={deleting === lead._id}
                                        className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="Delete lead"
                                    >
                                        {deleting === lead._id ? (
                                            <span className="text-xs">Deleting...</span>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500">
                                    No leads found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal for Lead Details */}
            {selectedLead && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedLead(null)}
                >
                    <div
                        className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                            <h2 className="text-2xl font-bold text-white">Lead Details</h2>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-zinc-400 uppercase tracking-wide">Date</label>
                                    <p className="text-white font-medium mt-1">
                                        {new Date(selectedLead.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-400 uppercase tracking-wide">Name</label>
                                    <p className="text-white font-medium mt-1">{selectedLead.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-zinc-400 uppercase tracking-wide">Email</label>
                                    <p className="text-white font-medium mt-1">
                                        <a href={`mailto:${selectedLead.email}`} className="hover:underline">
                                            {selectedLead.email}
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-400 uppercase tracking-wide">WhatsApp</label>
                                    <p className="text-white font-medium mt-1">
                                        {selectedLead.whatsapp ? (
                                            <a
                                                href={`https://wa.me/${selectedLead.whatsapp.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline text-green-400"
                                            >
                                                {selectedLead.whatsapp}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-zinc-400 uppercase tracking-wide">Company</label>
                                    <p className="text-white font-medium mt-1">{selectedLead.company || "-"}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-400 uppercase tracking-wide">Service</label>
                                    <p className="text-white font-medium mt-1">{selectedLead.service || "-"}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-zinc-400 uppercase tracking-wide">Message</label>
                                <p className="text-white mt-1 whitespace-pre-wrap bg-zinc-800 p-4 rounded border border-zinc-700">
                                    {selectedLead.message}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-between items-center p-6 border-t border-zinc-800">
                            <Button
                                onClick={() => {
                                    handleDelete(selectedLead._id, selectedLead.name);
                                    setSelectedLead(null);
                                }}
                                disabled={deleting === selectedLead._id}
                            >
                                {deleting === selectedLead._id ? "Deleting..." : "Delete Lead"}
                            </Button>
                            <Button
                                onClick={() => setSelectedLead(null)}
                                variant="outline"
                                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
