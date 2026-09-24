"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Layers,
  GitBranch,
  Gift,
  Users,
  Award,
  Upload,
  Loader2,
} from "lucide-react";
import { uploadEventImage } from "@/services/Events/eventServices";

interface SubPoint {
  text: string;
}

interface CarouselPoint {
  title: string;
  subPoints: SubPoint[];
}

interface EventFlowItem {
  title: string;
  description: string;
}

interface ExclusiveBenefitItem {
  title: string;
  description: string;
}

interface ExclusiveBenefitBox {
  icon: string;
  description: string;
}

export interface TeardownEventDetails {
  section1_carousel?: {
    sectionName?: string;
    points?: CarouselPoint[];
    note?: string;
    description?: string;
  };
  eventFlow?: {
    sectionName?: string;
    items?: EventFlowItem[];
  };
  exclusiveBenefits?: {
    sectionName?: string;
    firstPrize?: string;
    descriptionFirst?: string;
    descriptionSecond?: string;
    secondPrize?: string;
    thirdPrize?: string;
    items?: ExclusiveBenefitItem[];
    boxPoints?: ExclusiveBenefitBox[];
  };
  whoShouldAttend?: {
    sectionName?: string;
    names?: string[];
  };
  DetailHeader?: {
    Header?: string;
    Subtitle?: string;
  };
  certificateSection?: {
    header?: string;
    subheading?: string;
    certificateUrl?: string;
  };
  whatsappLink?: {
    Link?: string;
    studentLink?: string;
    professionalLink?: string;
  };
}

interface TeardownEventFormProps {
  eventDetails: TeardownEventDetails;
  setEventDetails: (details: TeardownEventDetails) => void;
  eventType: "Teardown" | "Hackathon";
}

export function TeardownEventForm({
  eventDetails,
  setEventDetails,
  eventType,
}: TeardownEventFormProps) {
  const [currentAttendee, setCurrentAttendee] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);

  React.useEffect(() => {
    const needsInitialization =
      !eventDetails.section1_carousel ||
      !eventDetails.eventFlow ||
      !eventDetails.exclusiveBenefits ||
      !eventDetails.whoShouldAttend ||
      !eventDetails.whatsappLink;

    if (needsInitialization) {
      setEventDetails({
        ...eventDetails,
        section1_carousel: eventDetails.section1_carousel || {
          sectionName: "Event Overview & Format",
          points: [{ title: "", subPoints: [{ text: "" }] }],
          description: "",
        },
        eventFlow: eventDetails.eventFlow || {
          sectionName: "Timeline & Rounds",
          items: [{ title: "Round 1: Problem Release", description: "" }],
        },
        exclusiveBenefits: eventDetails.exclusiveBenefits || {
          sectionName: "Prizes & Rewards",
          firstPrize: "₹25,000",
          secondPrize: "₹15,000",
          thirdPrize: "₹10,000",
          items: [],
          boxPoints: [],
        },
        whoShouldAttend: eventDetails.whoShouldAttend || {
          sectionName: "Who Can Participate",
          names: [],
        },
        whatsappLink: eventDetails.whatsappLink || { Link: "" },
      });
    }
  }, []);

  const handleNestedChange = (section: string, field: string, value: any) => {
    setEventDetails({
      ...eventDetails,
      [section]: {
        ...(eventDetails[section as keyof TeardownEventDetails] as any),
        [field]: value,
      },
    });
  };

  // Carousel Points
  const addCarouselPoint = () => {
    const points = eventDetails.section1_carousel?.points || [];
    handleNestedChange("section1_carousel", "points", [
      ...points,
      { title: "", subPoints: [{ text: "" }] },
    ]);
  };

  const removeCarouselPoint = (index: number) => {
    const points = (eventDetails.section1_carousel?.points || []).filter((_, i) => i !== index);
    handleNestedChange("section1_carousel", "points", points);
  };

  const updateCarouselTitle = (index: number, title: string) => {
    const points = [...(eventDetails.section1_carousel?.points || [])];
    if (points[index]) {
      points[index] = { ...points[index], title };
      handleNestedChange("section1_carousel", "points", points);
    }
  };

  const addSubPoint = (pointIndex: number) => {
    const points = [...(eventDetails.section1_carousel?.points || [])];
    if (points[pointIndex]) {
      points[pointIndex] = {
        ...points[pointIndex],
        subPoints: [...points[pointIndex].subPoints, { text: "" }],
      };
      handleNestedChange("section1_carousel", "points", points);
    }
  };

  const updateSubPoint = (pointIndex: number, subIndex: number, text: string) => {
    const points = [...(eventDetails.section1_carousel?.points || [])];
    if (points[pointIndex] && points[pointIndex].subPoints[subIndex]) {
      points[pointIndex].subPoints[subIndex] = { text };
      handleNestedChange("section1_carousel", "points", points);
    }
  };

  const removeSubPoint = (pointIndex: number, subIndex: number) => {
    const points = [...(eventDetails.section1_carousel?.points || [])];
    if (points[pointIndex]) {
      points[pointIndex].subPoints = points[pointIndex].subPoints.filter((_, i) => i !== subIndex);
      handleNestedChange("section1_carousel", "points", points);
    }
  };

  // Flow items
  const addFlowItem = () => {
    const items = eventDetails.eventFlow?.items || [];
    handleNestedChange("eventFlow", "items", [
      ...items,
      { title: "", description: "" },
    ]);
  };

  const removeFlowItem = (index: number) => {
    const items = (eventDetails.eventFlow?.items || []).filter((_, i) => i !== index);
    handleNestedChange("eventFlow", "items", items);
  };

  const updateFlowItem = (index: number, field: "title" | "description", val: string) => {
    const items = [...(eventDetails.eventFlow?.items || [])];
    if (items[index]) {
      items[index] = { ...items[index], [field]: val };
      handleNestedChange("eventFlow", "items", items);
    }
  };

  // Attendees
  const addAttendee = () => {
    if (!currentAttendee.trim()) return;
    const names = eventDetails.whoShouldAttend?.names || [];
    if (!names.includes(currentAttendee.trim())) {
      handleNestedChange("whoShouldAttend", "names", [...names, currentAttendee.trim()]);
    }
    setCurrentAttendee("");
  };

  const removeAttendee = (index: number) => {
    const names = (eventDetails.whoShouldAttend?.names || []).filter((_, i) => i !== index);
    handleNestedChange("whoShouldAttend", "names", names);
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCert(true);
      const res = await uploadEventImage(file);
      handleNestedChange("certificateSection", "certificateUrl", res.fileUrl);
    } catch {
      alert("Certificate upload failed");
    } finally {
      setUploadingCert(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            WhatsApp Community Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Official WhatsApp Group URL</Label>
            <Input
              value={eventDetails.whatsappLink?.Link || ""}
              onChange={(e) =>
                setEventDetails({
                  ...eventDetails,
                  whatsappLink: {
                    ...eventDetails.whatsappLink,
                    Link: e.target.value,
                  },
                })
              }
              placeholder="https://chat.whatsapp.com/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Overview & Format */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            {eventType} Format & Guidelines
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addCarouselPoint}>
            <Plus className="w-4 h-4 mr-1" /> Add Phase
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Section Title</Label>
            <Input
              value={eventDetails.section1_carousel?.sectionName || ""}
              onChange={(e) =>
                handleNestedChange("section1_carousel", "sectionName", e.target.value)
              }
              placeholder="Event Format"
            />
          </div>

          <div className="space-y-4">
            {(eventDetails.section1_carousel?.points || []).map((point, pIndex) => (
              <div key={pIndex} className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={point.title}
                    onChange={(e) => updateCarouselTitle(pIndex, e.target.value)}
                    placeholder={`Phase #${pIndex + 1} Title`}
                    className="font-medium"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => removeCarouselPoint(pIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="pl-4 space-y-2">
                  <Label className="text-xs text-muted-foreground">Guidelines / Sub-points</Label>
                  {(point.subPoints || []).map((sub, sIndex) => (
                    <div key={sIndex} className="flex items-center gap-2">
                      <Input
                        value={sub.text}
                        onChange={(e) => updateSubPoint(pIndex, sIndex, e.target.value)}
                        placeholder="Point detail..."
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => removeSubPoint(pIndex, sIndex)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => addSubPoint(pIndex)}
                    className="text-xs text-blue-600"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Guideline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rounds & Flow */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            Timeline & Rounds
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addFlowItem}>
            <Plus className="w-4 h-4 mr-1" /> Add Round
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Section Title</Label>
            <Input
              value={eventDetails.eventFlow?.sectionName || ""}
              onChange={(e) =>
                handleNestedChange("eventFlow", "sectionName", e.target.value)
              }
              placeholder="Rounds & Timeline"
            />
          </div>

          <div className="space-y-3">
            {(eventDetails.eventFlow?.items || []).map((item, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/10">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={item.title}
                    onChange={(e) => updateFlowItem(index, "title", e.target.value)}
                    placeholder={`Round #${index + 1} Name`}
                    className="font-medium"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => removeFlowItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateFlowItem(index, "description", e.target.value)}
                  placeholder="Round rules, deliverables, deadlines..."
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prizes & Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-600" />
            Prizes & Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>🥇 1st Prize Reward</Label>
              <Input
                value={eventDetails.exclusiveBenefits?.firstPrize || ""}
                onChange={(e) =>
                  handleNestedChange("exclusiveBenefits", "firstPrize", e.target.value)
                }
                placeholder="e.g. ₹25,000 + Certificate"
              />
            </div>
            <div className="space-y-1.5">
              <Label>🥈 2nd Prize Reward</Label>
              <Input
                value={eventDetails.exclusiveBenefits?.secondPrize || ""}
                onChange={(e) =>
                  handleNestedChange("exclusiveBenefits", "secondPrize", e.target.value)
                }
                placeholder="e.g. ₹15,000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>🥉 3rd Prize Reward</Label>
              <Input
                value={eventDetails.exclusiveBenefits?.thirdPrize || ""}
                onChange={(e) =>
                  handleNestedChange("exclusiveBenefits", "thirdPrize", e.target.value)
                }
                placeholder="e.g. ₹10,000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Who Can Participate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Eligible Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={currentAttendee}
              onChange={(e) => setCurrentAttendee(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAttendee();
                }
              }}
              placeholder="e.g. Open to all students & working professionals"
            />
            <Button type="button" onClick={addAttendee}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(eventDetails.whoShouldAttend?.names || []).map((name, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                {name}
                <button
                  type="button"
                  onClick={() => removeAttendee(index)}
                  className="hover:text-red-500 font-bold"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certificate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Participation & Winner Certificates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Header</Label>
              <Input
                value={eventDetails.certificateSection?.header || ""}
                onChange={(e) =>
                  handleNestedChange("certificateSection", "header", e.target.value)
                }
                placeholder="Official Certificate of Achievement"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subheading</Label>
              <Input
                value={eventDetails.certificateSection?.subheading || ""}
                onChange={(e) =>
                  handleNestedChange("certificateSection", "subheading", e.target.value)
                }
                placeholder="Share your verified achievement on LinkedIn"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sample Certificate</Label>
            <div className="flex items-center gap-4">
              {eventDetails.certificateSection?.certificateUrl && (
                <img
                  src={eventDetails.certificateSection.certificateUrl}
                  alt="Certificate"
                  className="h-24 w-36 object-cover rounded-lg border"
                />
              )}
              <div>
                <input
                  type="file"
                  id="cert-upload-td"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCertUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingCert}
                  onClick={() => document.getElementById("cert-upload-td")?.click()}
                >
                  {uploadingCert ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Sample
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
