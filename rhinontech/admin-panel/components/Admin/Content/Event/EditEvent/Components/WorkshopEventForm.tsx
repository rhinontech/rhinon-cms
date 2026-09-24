"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Award, Users, Target, BookOpen, Upload, Loader2 } from "lucide-react";
import { uploadEventImage } from "@/services/Events/eventServices";

interface IconPoint {
  title: string;
  subtitles: string[];
}

export interface WorkshopEventDetails {
  section2_iconPoints?: {
    sectionName?: string;
    points?: IconPoint[];
  };
  section3_coloredTags?: {
    sectionName?: string;
    names?: string[];
  };
  section4_Header?: {
    sectionName?: string;
    names?: string[];
  };
  whatsappLink?: {
    Link?: string;
    studentLink?: string;
    professionalLink?: string;
  };
  certificateSection?: {
    header?: string;
    subheading?: string;
    certificateUrl?: string;
  };
}

interface WorkshopEventFormProps {
  eventDetails: WorkshopEventDetails;
  setEventDetails: (details: WorkshopEventDetails) => void;
}

export function WorkshopEventForm({
  eventDetails,
  setEventDetails,
}: WorkshopEventFormProps) {
  const [currentTag, setCurrentTag] = useState("");
  const [currentHeaderItem, setCurrentHeaderItem] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);

  React.useEffect(() => {
    const needsInitialization =
      !eventDetails.section2_iconPoints ||
      !eventDetails.section3_coloredTags ||
      !eventDetails.section4_Header ||
      !eventDetails.certificateSection ||
      !eventDetails.whatsappLink;

    if (needsInitialization) {
      setEventDetails({
        ...eventDetails,
        section2_iconPoints: eventDetails.section2_iconPoints || {
          sectionName: "What You Will Learn",
          points: [{ title: "", subtitles: [""] }],
        },
        section3_coloredTags: eventDetails.section3_coloredTags || {
          sectionName: "Key Highlights",
          names: [],
        },
        section4_Header: eventDetails.section4_Header || {
          sectionName: "Who is this for?",
          names: [],
        },
        whatsappLink: eventDetails.whatsappLink || { Link: "" },
        certificateSection: eventDetails.certificateSection || {
          header: "Official Certificate of Completion",
          subheading: "Add this credential to your LinkedIn profile and resume upon finishing the workshop.",
          certificateUrl: "",
        },
      });
    }
  }, []);

  const handleNestedChange = (section: string, field: string, value: any) => {
    setEventDetails({
      ...eventDetails,
      [section]: {
        ...(eventDetails[section as keyof WorkshopEventDetails] as any),
        [field]: value,
      },
    });
  };

  // Icon points
  const addIconPoint = () => {
    const points = eventDetails.section2_iconPoints?.points || [];
    handleNestedChange("section2_iconPoints", "points", [
      ...points,
      { title: "", subtitles: [""] },
    ]);
  };

  const removeIconPoint = (index: number) => {
    const points = (eventDetails.section2_iconPoints?.points || []).filter((_, i) => i !== index);
    handleNestedChange("section2_iconPoints", "points", points);
  };

  const updateIconPointTitle = (index: number, title: string) => {
    const points = [...(eventDetails.section2_iconPoints?.points || [])];
    if (points[index]) {
      points[index] = { ...points[index], title };
      handleNestedChange("section2_iconPoints", "points", points);
    }
  };

  const addSubtitle = (pointIndex: number) => {
    const points = [...(eventDetails.section2_iconPoints?.points || [])];
    if (points[pointIndex]) {
      points[pointIndex] = {
        ...points[pointIndex],
        subtitles: [...points[pointIndex].subtitles, ""],
      };
      handleNestedChange("section2_iconPoints", "points", points);
    }
  };

  const updateSubtitle = (pointIndex: number, subIndex: number, text: string) => {
    const points = [...(eventDetails.section2_iconPoints?.points || [])];
    if (points[pointIndex] && points[pointIndex].subtitles) {
      points[pointIndex].subtitles[subIndex] = text;
      handleNestedChange("section2_iconPoints", "points", points);
    }
  };

  const removeSubtitle = (pointIndex: number, subIndex: number) => {
    const points = [...(eventDetails.section2_iconPoints?.points || [])];
    if (points[pointIndex]) {
      points[pointIndex].subtitles = points[pointIndex].subtitles.filter((_, i) => i !== subIndex);
      handleNestedChange("section2_iconPoints", "points", points);
    }
  };

  // Tags
  const addTag = () => {
    if (!currentTag.trim()) return;
    const names = eventDetails.section3_coloredTags?.names || [];
    if (!names.includes(currentTag.trim())) {
      handleNestedChange("section3_coloredTags", "names", [...names, currentTag.trim()]);
    }
    setCurrentTag("");
  };

  const removeTag = (index: number) => {
    const names = (eventDetails.section3_coloredTags?.names || []).filter((_, i) => i !== index);
    handleNestedChange("section3_coloredTags", "names", names);
  };

  // Target audience
  const addHeaderItem = () => {
    if (!currentHeaderItem.trim()) return;
    const names = eventDetails.section4_Header?.names || [];
    if (!names.includes(currentHeaderItem.trim())) {
      handleNestedChange("section4_Header", "names", [...names, currentHeaderItem.trim()]);
    }
    setCurrentHeaderItem("");
  };

  const removeHeaderItem = (index: number) => {
    const names = (eventDetails.section4_Header?.names || []).filter((_, i) => i !== index);
    handleNestedChange("section4_Header", "names", names);
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
      {/* WhatsApp Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            WhatsApp Community Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Default WhatsApp Group Link</Label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Student-specific Link (Optional)</Label>
              <Input
                value={eventDetails.whatsappLink?.studentLink || ""}
                onChange={(e) =>
                  setEventDetails({
                    ...eventDetails,
                    whatsappLink: {
                      ...eventDetails.whatsappLink,
                      studentLink: e.target.value,
                    },
                  })
                }
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Professional-specific Link (Optional)</Label>
              <Input
                value={eventDetails.whatsappLink?.professionalLink || ""}
                onChange={(e) =>
                  setEventDetails({
                    ...eventDetails,
                    whatsappLink: {
                      ...eventDetails.whatsappLink,
                      professionalLink: e.target.value,
                    },
                  })
                }
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: What You Will Learn (Icon Points) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            What You Will Learn
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addIconPoint}>
            <Plus className="w-4 h-4 mr-1" /> Add Topic
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Section Title</Label>
            <Input
              value={eventDetails.section2_iconPoints?.sectionName || ""}
              onChange={(e) =>
                handleNestedChange("section2_iconPoints", "sectionName", e.target.value)
              }
              placeholder="What You Will Learn"
            />
          </div>

          <div className="space-y-4">
            {(eventDetails.section2_iconPoints?.points || []).map((point, pIndex) => (
              <div key={pIndex} className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={point.title}
                    onChange={(e) => updateIconPointTitle(pIndex, e.target.value)}
                    placeholder={`Topic #${pIndex + 1} Title`}
                    className="font-medium"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => removeIconPoint(pIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="pl-4 space-y-2">
                  <Label className="text-xs text-muted-foreground">Bullet Sub-points</Label>
                  {(point.subtitles || []).map((sub, sIndex) => (
                    <div key={sIndex} className="flex items-center gap-2">
                      <Input
                        value={sub}
                        onChange={(e) => updateSubtitle(pIndex, sIndex, e.target.value)}
                        placeholder="Bullet point detail..."
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => removeSubtitle(pIndex, sIndex)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => addSubtitle(pIndex)}
                    className="text-xs text-blue-600"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Sub-point
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Key Highlights (Tags) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Key Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Section Title</Label>
            <Input
              value={eventDetails.section3_coloredTags?.sectionName || ""}
              onChange={(e) =>
                handleNestedChange("section3_coloredTags", "sectionName", e.target.value)
              }
              placeholder="Key Highlights"
            />
          </div>

          <div className="flex gap-2">
            <Input
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="e.g. 100% Practical & Interactive"
            />
            <Button type="button" onClick={addTag}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(eventDetails.section3_coloredTags?.names || []).map((name, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                {name}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="hover:text-red-500 font-bold"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Who Is This For */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Who Should Attend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Section Title</Label>
            <Input
              value={eventDetails.section4_Header?.sectionName || ""}
              onChange={(e) =>
                handleNestedChange("section4_Header", "sectionName", e.target.value)
              }
              placeholder="Who is this workshop for?"
            />
          </div>

          <div className="flex gap-2">
            <Input
              value={currentHeaderItem}
              onChange={(e) => setCurrentHeaderItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHeaderItem();
                }
              }}
              placeholder="e.g. Aspiring Product Managers & Designers"
            />
            <Button type="button" onClick={addHeaderItem}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(eventDetails.section4_Header?.names || []).map((name, index) => (
              <Badge key={index} variant="outline" className="px-3 py-1.5 text-sm gap-2">
                {name}
                <button
                  type="button"
                  onClick={() => removeHeaderItem(index)}
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
            Certificate of Completion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Certificate Header</Label>
              <Input
                value={eventDetails.certificateSection?.header || ""}
                onChange={(e) =>
                  handleNestedChange("certificateSection", "header", e.target.value)
                }
                placeholder="Official Certificate of Completion"
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
            <Label>Sample Certificate Image</Label>
            <div className="flex items-center gap-4">
              {eventDetails.certificateSection?.certificateUrl && (
                <img
                  src={eventDetails.certificateSection.certificateUrl}
                  alt="Certificate Sample"
                  className="h-24 w-36 object-cover rounded-lg border"
                />
              )}
              <div>
                <input
                  type="file"
                  id="cert-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCertUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingCert}
                  onClick={() => document.getElementById("cert-upload")?.click()}
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
