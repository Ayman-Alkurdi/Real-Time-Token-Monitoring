# Dashboard Improvement Plan

This document outlines potential improvements for the real-time token monitoring dashboard, focusing on deeper analytics, user experience, and core functionality.

### 1. Deeper Data Insights & Analytics

- [ ] **Cost Analysis:**
  - [ ] Add a settings input for cost-per-token (input and output).
  - [ ] Calculate and display the total estimated cost of a session.
- [ ] **Aggregate Statistics:**
  - [ ] Calculate and display "Average Tokens per Turn."
  - [ ] Identify and highlight the most "expensive" turn in a session.
- [ ] **Historical Data & Comparisons:**
  - [ ] Create a separate "Overview" page to show trends across multiple sessions.
  - [ ] Implement functionality to compare statistics between selected sessions.

### 2. User Experience (UX) & UI Enhancements

- [ ] **Interactive Activity Log:**
  - [ ] Make table rows in the "Recent Activity" log clickable.
  - [ ] On click, expand the row to show the full user prompt and LLM response.
- [ ] **Chart Interactivity:**
  - [ ] Add toggles to show/hide individual lines (total, input, output) on the chart.
  - [ ] Enhance tooltips with more detailed information on hover.
- [ ] **Improved Empty & Loading States:**
  - [ ] Design a "Welcome" or "Getting Started" view for the initial state.
  - [ ] Implement more granular loading indicators for individual panels.
- [ ] **Search & Filtering:**
  - [ ] Add a search bar to filter the "Recent Activity" log by keywords.

### 3. Core Functionality

- [ ] **Configurable File Paths:**
  - [ ] Allow the monitoring directory to be configured via an environment variable or a settings panel.
- [ ] **Data Export:**
  - [ ] Add a button to export session data (KPIs, chart, log) as a CSV or JSON file.
- [ ] **Automatic Refresh of Session List:**
  - [ ] Add a "Refresh" button to manually update the session and file lists.
  - [ ] Implement periodic automatic refreshing of the lists.
