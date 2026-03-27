import { Router } from "express";
import { authController }          from "../modules/auth/auth.controller";
import { itemsController }         from "../modules/items/items.controller";
import { borrowRecordsController } from "../modules/borrowRecords/borrowRecords.controller";
import { borrowRequestsController } from "../modules/borrowRequests/borrowRequests.controller";
import auth                        from "../middlewares/auth";
import { activityLogController } from "../modules/activityLog/activityLog.controller";
import { remindersController } from "../modules/reminders/reminders.controller";
const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post("/auth/login",    authController.login);
router.post("/auth/register", auth(), authController.register);

// Admin management
router.get   ("/auth/admins",     auth(), authController.getAdmins);
router.delete("/auth/admins/:id", auth(), authController.deleteAdmin);

// Account settings
router.put("/auth/change-password", auth(), authController.changePassword);
router.put("/auth/change-email",    auth(), authController.changeEmail);
router.put("/auth/change-username", auth(), authController.changeUsername);

// ── Items ─────────────────────────────────────────────────────────────────────
router.get   ("/items",     auth(), itemsController.getItems);
router.get   ("/items/:id", auth(), itemsController.getSingleItem);
router.post  ("/items",     auth(), itemsController.createItem);
router.put   ("/items/:id", auth(), itemsController.updateItem);
router.delete("/items/:id", auth(), itemsController.deleteItem);

// ── Borrow Records ────────────────────────────────────────────────────────────
// Static routes MUST come before /:id
router.get("/borrow-records/stats",   auth(), borrowRecordsController.getStats);
router.get("/borrow-records/overdue", auth(), borrowRecordsController.getOverdue);

// ── Reminders ─────────────────────────────────────────
router.post("/reminders/send", auth(), remindersController.sendReminders);
router.get("/reminders/settings", auth(), remindersController.getSettings);
router.put("/reminders/settings", auth(), remindersController.updateSettings);

// Bulk actions
router.put   ("/borrow-records/bulk-return", auth(), borrowRecordsController.bulkReturn);
router.delete("/borrow-records/bulk-delete", auth(), borrowRecordsController.bulkDelete);

// CRUD
router.get   ("/borrowers",               auth(), borrowRecordsController.getBorrowers);
router.get   ("/borrow-records",          auth(), borrowRecordsController.getRecords);
router.get   ("/borrow-records/:id",      auth(), borrowRecordsController.getSingleRecord);
router.post  ("/borrow-records",          auth(), borrowRecordsController.createRecord);
router.put   ("/borrow-records/:id",      auth(), borrowRecordsController.updateRecord);
router.put   ("/borrow-records/:id/return", auth(), borrowRecordsController.returnRecord);
router.delete("/borrow-records/:id",      auth(), borrowRecordsController.deleteRecord);

router.get("/activity-logs", auth(), activityLogController.getLogs);
router.delete("/activity-logs", auth, activityLogController.clearAll);

// ── Borrow Requests ─────────────────────────────────────────
router.get("/borrow-requests", auth(), borrowRequestsController.getRequests);

// PUBLIC (no login)
router.post("/borrow-requests", borrowRequestsController.createRequest);

router.put(
  "/borrow-requests/:id/approve",
  auth(),
  borrowRequestsController.approveRequest
);

router.put(
  "/borrow-requests/:id/reject",
  auth(),
  borrowRequestsController.rejectRequest
);

export default router;