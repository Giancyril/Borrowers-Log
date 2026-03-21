import { Router } from "express";
import { authController }          from "../modules/auth/auth.controller";
import { itemsController }         from "../modules/items/items.controller";
import { borrowRecordsController } from "../modules/borrowRecords/borrowRecords.controller";
import auth                        from "../middlewares/auth";

const router = Router();

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post("/auth/login",    authController.login);
router.post("/auth/register", auth(), authController.register); // admin-only after first setup

// ── Items (all admin) ─────────────────────────────────────────────────────────
router.get   ("/items",     auth(), itemsController.getItems);
router.get   ("/items/:id", auth(), itemsController.getSingleItem);
router.post  ("/items",     auth(), itemsController.createItem);
router.put   ("/items/:id", auth(), itemsController.updateItem);
router.delete("/items/:id", auth(), itemsController.deleteItem);

// ── Borrow Records (all admin) ────────────────────────────────────────────────
router.get("/borrow-records/stats",   auth(), borrowRecordsController.getStats);
router.get("/borrow-records/overdue", auth(), borrowRecordsController.getOverdue);
router.get("/borrow-records",         auth(), borrowRecordsController.getRecords);
router.get("/borrow-records/:id",     auth(), borrowRecordsController.getSingleRecord);

router.post  ("/borrow-records",              auth(), borrowRecordsController.createRecord);
router.put   ("/borrow-records/:id",          auth(), borrowRecordsController.updateRecord);
router.put   ("/borrow-records/:id/return",   auth(), borrowRecordsController.returnRecord);
router.delete("/borrow-records/:id",          auth(), borrowRecordsController.deleteRecord);

export default router;