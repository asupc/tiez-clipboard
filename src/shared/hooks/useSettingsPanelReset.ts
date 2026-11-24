import { useEffect } from "react";
import { DEFAULT_COLLAPSED_GROUPS } from "../../features/settings/types";

interface UseSettingsPanelResetOptions {
  showSettings: boolean;
  setCollapsedGroups: (val: Record<string, boolean>) => void;
}

export const useSettingsPanelReset = ({
  showSettings,
  setCollapsedGroups
}: UseSettingsPanelResetOptions) => {
  useEffect(() => {
    if (showSettings) {
      setCollapsedGroups(DEFAULT_COLLAPSED_GROUPS);
    }
  }, [showSettings, setCollapsedGroups]);
};
