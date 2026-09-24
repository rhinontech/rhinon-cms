"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle2 } from "lucide-react";
import { useNotification } from "@/helpers/NotificationContext";

export default function CertificateTemplate() {
  const { showNotification } = useNotification();
  const [certTitle, setCertTitle] = useState("Certificate of Completion");
  const [issuer, setIssuer] = useState("Product Space");
  const [signatureName, setSignatureName] = useState("Lead Instructor");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    showNotification("success", "Certificate Configured", "Certificate template settings saved.");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            Certificate Template Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Certificate Title</Label>
              <Input
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="Certificate of Completion"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Issuer / Organization Name</Label>
              <Input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Product Space"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Signatory / Instructor Name</Label>
            <Input
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g. Head of Product"
            />
          </div>

          {/* Certificate Live Preview Box */}
          <div className="border-2 border-dashed border-amber-300/60 dark:border-amber-700/40 rounded-xl p-8 bg-amber-50/30 dark:bg-amber-950/10 text-center space-y-3">
            <Award className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-xl font-serif font-bold text-foreground">{certTitle}</h3>
            <p className="text-xs text-muted-foreground">This is proudly presented to</p>
            <div className="text-lg font-semibold border-b border-muted max-w-xs mx-auto pb-1 text-foreground">
              [Attendee Full Name]
            </div>
            <p className="text-xs text-muted-foreground">For successfully completing the workshop and evaluation.</p>
            <div className="pt-4 flex justify-between max-w-md mx-auto text-xs text-muted-foreground border-t">
              <div>Issued by: <span className="font-semibold text-foreground">{issuer}</span></div>
              <div>Signed by: <span className="font-semibold text-foreground">{signatureName}</span></div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" size="sm" onClick={handleSave} className="gap-1.5">
              {saved && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
              {saved ? "Saved" : "Save Template"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
