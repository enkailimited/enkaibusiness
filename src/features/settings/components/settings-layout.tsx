"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SETTING_CATEGORIES } from "../constants";
import { BusinessSettingsForm } from "./business-settings-form";
import { TaxSettingsForm } from "./tax-settings-form";
import { ReceiptSettingsForm } from "./receipt-settings-form";
import { NumberingSettingsForm } from "./numbering-settings-form";
import { PaymentSettingsForm } from "./payment-settings-form";
import { UserSettingsForm } from "./user-settings-form";
import type { SettingCategory } from "../types";

interface SettingsLayoutProps {
  businessId?: string;
  userId?: string;
  defaultTab?: SettingCategory;
}

const categoryForms: Record<SettingCategory, React.ComponentType<{ businessId?: string; userId?: string }>> = {
  business: BusinessSettingsForm,
  tax: TaxSettingsForm,
  receipt: ReceiptSettingsForm,
  numbering: NumberingSettingsForm,
  payment: PaymentSettingsForm,
  user: UserSettingsForm,
};

export function SettingsLayout({ businessId, userId, defaultTab = "business" }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingCategory>(defaultTab);

  const ActiveForm = categoryForms[activeTab];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {SETTING_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === cat.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{SETTING_CATEGORIES.find((c) => c.id === activeTab)?.label}</CardTitle>
          <CardDescription>
            {SETTING_CATEGORIES.find((c) => c.id === activeTab)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveForm businessId={businessId} userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
