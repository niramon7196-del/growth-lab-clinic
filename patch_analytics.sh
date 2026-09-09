sed -i -e "s/interface CheckInAnalyticsPanelProps {/interface CheckInAnalyticsPanelProps {\n  logs?: CheckInRecord[];/g" src/components/CheckInAnalyticsPanel.tsx
sed -i -e "s/  patients,/  patients,\n  logs: propLogs,/g" src/components/CheckInAnalyticsPanel.tsx
