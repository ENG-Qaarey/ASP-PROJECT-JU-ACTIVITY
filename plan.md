# Plan: Publish Strategic Activity - Multi-Step Wizard with Requirements

## Overview

Convert the current single-page `AdminCreateActivity` form into a **5-step wizard** with new backend models for requirements, questions, draft/publish workflow, image upload, map picker, recurring activities, and a preview step.

---

## Current State

- Single-page form at `/admin/create-activity` with basic fields (title, description, category, coordinator, date, time, location, capacity)
- No draft/publish workflow -- activities are immediately visible
- No requirements or prerequisites system
- No student questions
- No image upload during creation
- No map location picker
- No recurring activity support
- "Strategic" label is purely cosmetic

---

## New Backend Models

### 1. `ActivityRequirement` -- Requirements/prerequisites for an activity

```
- Id (Guid, PK)
- ActivityId (Guid, FK to Activity)
- Type (enum: Department, YearLevel, GpaMin, CustomText)
- Label (string - display name)
- Value (string - JSON-serialized value)
- IsRequired (bool)
```

### 2. `ActivityQuestion` -- Questions students must answer when applying

```
- Id (Guid, PK)
- ActivityId (Guid, FK to Activity)
- QuestionText (string)
- QuestionType (enum: YesNo, MultipleChoice, FreeText)
- Options (string - JSON array for MultipleChoice, null for others)
- IsRequired (bool)
- DisplayOrder (int)
```

### 3. `ApplicationAnswer` -- Student answers to activity questions

```
- Id (Guid, PK)
- ApplicationId (Guid, FK to Application)
- ActivityQuestionId (Guid, FK to ActivityQuestion)
- Answer (string)
```

### 4. `Department` -- Available departments

```
- Id (Guid, PK)
- Name (string, unique)
```

### 5. Activity model additions

```
+ IsDraft (bool, default true)
+ RecurrencePattern (string, nullable) -- JSON config
+ ParentActivityId (Guid, nullable, FK self-ref)
+ Requirements (ICollection<ActivityRequirement>)
+ Questions (ICollection<ActivityQuestion>)
```

### 6. ActivityStatus additions

Add `Draft` to the existing enum: `Upcoming, Ongoing, Completed` -> `Draft, Upcoming, Ongoing, Completed`

### 7. Application model additions

```
+ Answers (ICollection<ApplicationAnswer>)
```

---

## New Enums

### RequirementType
- `Department` -- Restrict to specific departments
- `YearLevel` -- Restrict to specific year levels (1st, 2nd, 3rd, 4th, 5th+)
- `GpaMin` -- Minimum GPA threshold
- `CustomText` -- Admin writes custom requirement text

### QuestionType
- `YesNo` -- Student picks Yes or No
- `MultipleChoice` -- Student picks from predefined options
- `FreeText` -- Student writes free-form answer

---

## Frontend: 5-Step Wizard

### Step 1: Basic Info
- Activity Title (text input, required)
- Description (textarea, required)
- Category (select dropdown, required) + manage categories modal
- Coordinator assignment (select, required if coordinators exist)

### Step 2: Schedule & Location
- Date (date picker, required)
- Time (time picker, required)
- Location text (text input, required)
- Map location picker (Leaflet/OSM map, pick lat/lng)
- Capacity (number input, required, min 1)
- Image upload (file input, upload to server)
- Recurrence toggle + config:
  - Type: Weekly / Biweekly / Monthly
  - Days of week (for weekly/biweekly)
  - End date (when to stop recurring)
  - Creates multiple activity instances on publish

### Step 3: Requirements
- Department filter (multi-select from Department table)
- Year level filter (multi-select: 1st, 2nd, 3rd, 4th, 5th+)
- Minimum GPA (number input, optional)
- Custom text requirements (textarea, optional)
- Each requirement has a toggle to mark as required vs optional

### Step 4: Questions
- List of questions with add/edit/delete
- Each question has:
  - Question text (text input)
  - Type: YesNo / MultipleChoice / FreeText (radio buttons)
  - Options (for MultipleChoice: add/remove option fields)
  - Required toggle
  - Drag-to-reorder
- Questions appear on the student application form

### Step 5: Review & Publish
- Preview card showing how the activity looks to students
- Summary of all data from steps 1-4
- Requirements list preview
- Questions preview
- Two buttons:
  - **Save Draft** -- saves with `isDraft: true`, not visible to students
  - **Publish** -- saves with `isDraft: false`, immediately visible to students

### UI Components
- Step indicator/stepper at top showing progress (Step 1 > Step 2 > ...)
- Back/Next navigation buttons at bottom
- Save Draft button available at any step
- Validation per step (cannot proceed if required fields missing)

---

## Backend API Changes

### ActivitiesController modifications

| Endpoint | Change |
|----------|--------|
| `POST /api/activities` | Accept isDraft, requirements[], questions[], recurrence fields. If recurrence, batch-create multiple Activity instances. |
| `PUT /api/activities/{id}` | Support requirements and questions updates (delete old, insert new) |
| `GET /api/activities` | Filter out draft activities for non-admin users. Admin sees all including drafts. |
| `GET /api/activities/{id}` | Include requirements and questions in response |
| `GET /api/activities/drafts` | New -- admin-only endpoint to list draft activities |

### New endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/activities/{id}/publish` | Admin | Change isDraft from true to false |
| `POST /api/activities/{id}/image` | Admin | Upload image file, return URL |
| `GET /api/departments` | Anonymous | List all departments |
| `POST /api/departments` | Admin | Create department |
| `DELETE /api/departments/{id}` | Admin | Delete department |

### ApplicationsController modifications

| Endpoint | Change |
|----------|--------|
| `POST /api/applications` | Accept answers[] (question ID + answer) and save as ApplicationAnswer records |
| `GET /api/applications` | Include answers in response |

---

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `backend/Models/ActivityRequirement.cs` | Requirement entity |
| 2 | `backend/Models/ActivityQuestion.cs` | Question entity |
| 3 | `backend/Models/ApplicationAnswer.cs` | Student answer entity |
| 4 | `backend/Models/Department.cs` | Department entity |
| 5 | `backend/Models/Enums/RequirementType.cs` | Requirement type enum |
| 6 | `backend/Models/Enums/QuestionType.cs` | Question type enum |
| 7 | `backend/Controllers/DepartmentsController.cs` | Departments CRUD API |
| 8 | `backend/Data/Migrations/YYYYMMDDHHMMSS_AddActivityRequirements.cs` | EF migration |
| 9 | `ju-activity/src/components/admin/StepIndicator.tsx` | Wizard step progress bar |
| 10 | `ju-activity/src/components/admin/MapPicker.tsx` | Leaflet map location picker |
| 11 | `ju-activity/src/components/admin/QuestionBuilder.tsx` | Question editor component |
| 12 | `ju-activity/src/components/admin/ActivityPreview.tsx` | Preview card for review step |
| 13 | `ju-activity/src/components/admin/RequirementsEditor.tsx` | Requirements editor component |
| 14 | `ju-activity/src/components/admin/RecurrenceConfig.tsx` | Recurrence pattern config |
| 15 | `ju-activity/src/components/admin/ImageUploader.tsx` | Image upload component |

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `backend/Models/Enums/ActivityStatus.cs` | Add `Draft` status |
| 2 | `backend/Models/Activity.cs` | Add IsDraft, RecurrencePattern, ParentActivityId, nav props for Requirements/Questions |
| 3 | `backend/Models/Application.cs` | Add Answers nav prop |
| 4 | `backend/Data/AppDbContext.cs` | Add DbSets + entity configuration for new models |
| 5 | `backend/DTOs/ActivityDtos.cs` | Add requirement/question/recurrence fields to Create/Update DTOs |
| 6 | `backend/Controllers/ActivitiesController.cs` | Draft filtering, requirements/questions CRUD, image upload, recurrence, publish endpoint |
| 7 | `backend/Controllers/ApplicationsController.cs` | Accept and save question answers |
| 8 | `ju-activity/src/pages/admin/AdminCreateActivity.tsx` | **REWRITE** -- 5-step wizard |
| 9 | `ju-activity/src/types/api.ts` | Add new TypeScript interfaces |
| 10 | `ju-activity/src/lib/api.ts` | Add departmentsApi, update activitiesApi |
| 11 | `ju-activity/src/contexts/ActivityContext.tsx` | Update createActivity, draft handling, requirements/questions |
| 12 | `ju-activity/src/pages/student/ActivityDetails.tsx` | Show requirements + question form when applying |
| 13 | `ju-activity/src/pages/admin/AdminActivities.tsx` | Show draft indicator, publish button for drafts |
| 14 | `ju-activity/src/pages/student/StudentActivities.tsx` | Filter out draft activities (already handled by backend, but belt-and-suspenders) |

---

## Seed Data

### Default Departments (seeded in migration or DbContext)
- Computer Science
- Engineering
- Business Administration
- Medicine
- Law
- Education
- Arts and Sciences
- Architecture
- Pharmacy
- Nursing

---

## Recurrence Pattern Format

JSON stored in `Activity.RecurrencePattern`:
```json
{
  "type": "weekly",
  "daysOfWeek": ["Monday", "Wednesday"],
  "endDate": "2026-09-01",
  "interval": 1
}
```

When an activity with recurrence is published:
1. Parse the pattern
2. Generate dates from start date to end date matching the day-of-week pattern
3. Create a new Activity record for each date (copying all fields except date)
4. Set `ParentActivityId` on each child to link back to the original
5. The original activity's date becomes the first occurrence

---

## Implementation Order

### Phase 1: Backend Models + Database
1. Create new enum files (RequirementType, QuestionType)
2. Create new model files (ActivityRequirement, ActivityQuestion, ApplicationAnswer, Department)
3. Modify Activity model (add fields + nav props)
4. Modify Application model (add Answers nav prop)
5. Modify ActivityStatus enum (add Draft)
6. Update AppDbContext (add DbSets + configuration)
7. Create and apply EF migration
8. Seed default departments

### Phase 2: Backend API
9. Create DepartmentsController
10. Update ActivityDtos (add requirement/question/recurrence fields)
11. Update ActivitiesController:
    - Create endpoint: handle requirements, questions, recurrence, draft
    - GetAll: filter drafts for non-admins
    - GetById: include requirements + questions
    - New publish endpoint
    - New image upload endpoint
12. Update ApplicationsController: accept answers[]

### Phase 3: Frontend Shared Components
13. Create StepIndicator component
14. Create MapPicker component (Leaflet)
15. Create ImageUploader component
16. Create RequirementsEditor component
17. Create QuestionBuilder component
18. Create RecurrenceConfig component
19. Create ActivityPreview component

### Phase 4: Frontend Wizard
20. Rewrite AdminCreateActivity.tsx as 5-step wizard
21. Update types/api.ts with new interfaces
22. Update lib/api.ts with new API calls
23. Update contexts/ActivityContext.tsx

### Phase 5: Frontend Student-Side
24. Update ActivityDetails.tsx to show requirements + question form
25. Update AdminActivities.tsx to show draft status + publish button

---

## Dependencies

### Frontend packages to install
- `react-leaflet` + `leaflet` -- Map picker
- `@dnd-kit/core` + `@dnd-kit/sortable` -- Drag-to-reorder questions (optional, can use simple up/down buttons instead)

### Backend packages (already available)
- `Microsoft.EntityFrameworkCore` -- already in use
- `Microsoft.AspNetCore.StaticFiles` -- for image serving (already available)

---

## Notes

- Image upload: files saved to `wwwroot/uploads/activities/` and served as static files. URL stored in `Activity.ImageUrl`.
- Draft activities are completely hidden from students/coordinators -- backend filters them out of `GetAll`.
- Recurring activities create independent Activity records linked by `ParentActivityId`. Editing one does not affect others.
- Requirements are enforced on the backend when a student applies -- the `ApplicationsController.Create` endpoint validates requirements before allowing application.
- Question answers are saved alongside the application in a single transaction.
