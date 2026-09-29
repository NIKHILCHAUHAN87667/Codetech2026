# SAT-SA Clickable UI Prototype

This project is a React and Vite prototype of a supervisory assessment workflow. It is intended for guided demos and uses fictional CSEs, sample SOC records, illustrative metrics, and simulated processing.

## Requirements

- Node.js 22 (see `.mise.toml`)
- pnpm 10.34.3 (see `.mise.toml`)

## Install and run

From this project directory:

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The project defaults to port `8443`; when `PORT` is set, Vite uses that port instead. Keep the Vite process running while using the prototype. Do not open `index.html` directly or use a static file server: the app entry point is `src/main.tsx` and needs Vite to serve its React modules.

## Demo walkthrough

1. Click **Sign in securely** on the preconfigured supervisor login screen.
<img width="1535" height="701" alt="Screenshot 2026-09-30 000459" src="https://github.com/user-attachments/assets/2080283a-0d13-4ce4-90e5-a137a6070c53" />

2. On the dashboard, choose **New submission**.
<img width="1535" height="695" alt="image" src="https://github.com/user-attachments/assets/819cb470-e13a-4e9f-af7a-1c207db270e5" />

3. In Submission Management, choose the demo file and process the submission. The progress state is simulated.
<img width="1535" height="691" alt="image" src="https://github.com/user-attachments/assets/4dc56a75-d7cb-402c-bf89-bd9c402a28e4" />

4. Open the CSE assessment to review its metrics, trends, and supervisory signals.
<img width="1535" height="697" alt="image" src="https://github.com/user-attachments/assets/290565b0-5a8c-4712-aad1-88c3ce6d2533" />

5. Open the Review Worklist and review `CASE-1042`.
<img width="1532" height="688" alt="image" src="https://github.com/user-attachments/assets/179529d3-cacb-4631-ad8c-c1cf0cebcc3a" />

6. Inspect the case timeline, checklist, and expandable evidence metadata.
<img width="1535" height="691" alt="image" src="https://github.com/user-attachments/assets/8b2cb3fc-b5ee-4dbf-b973-0e2ae152bc4c" />

7. Continue to the Supervisor Decision screen, select an outcome, and submit a comment.
<img width="1535" height="691" alt="image" src="https://github.com/user-attachments/assets/9842717c-fc75-41df-a595-7850539e5e4c" />

8. Review the recorded outcome and audit details in the Assessment Report.
<img width="1523" height="690" alt="image" src="https://github.com/user-attachments/assets/86caed63-71e7-470c-910d-4ff1655cf2d4" />


The sidebar and responsive navigation also allow direct access to Dashboard, Submissions, CSE Assessments, Review Worklist, and Reports. Case Investigation and Supervisor Decision are reached from the review flow.

## Screens

- **Login:** demonstration access screen.
- **Dashboard:** portfolio summary, CSE assessment table, signal categories, trend chart, and recent submissions.
- **Submissions:** sample upload, validation summary, and simulated processing steps.
- **CSE Assessment:** metrics and supervisory signals for the selected entity.
- **Review Worklist:** prioritized cases, filters, and prioritization rationale.
- **Case Investigation:** case timeline, documentation checklist, evidence details, and analytical explanation.
- **Supervisor Decision:** confirm a concern, dismiss a signal, or request further review with a comment.
- **Assessment Report:** findings, decision, audit details, recommendations, and simulated export actions.

## Project structure

- `src/App.tsx` — React screens, reusable interface components, demo state, and navigation.
- `src/index.css` — Tailwind CSS import and global styles.
- `src/main.tsx` — React application entry point.
- `docs/SAT-SA-PROTOTYPE.md` — screen specification, demo scenario, and interaction notes.
- `satsa_sample_dataset/` — sample data provided with the project.

## Build and preview

```sh
pnpm build
pnpm preview
```

`pnpm build` runs the TypeScript check and creates the production bundle in `dist/`. `pnpm preview` serves that bundle locally.

## Demo data and limitations

All CSE names, case records, metrics, thresholds, evidence, and audit values are illustrative. The login is a presentation gate, not production authentication. File selection and analysis are simulated; no SOC analytics service or backend is connected. Report export controls show prototype feedback and do not create official assessment documents. A supervisory signal is a prompt for human review, not a determination that a CSE performed inadequately. Data-quality warnings are shown separately from operational signals.
