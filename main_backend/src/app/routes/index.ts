import express from "express";

import authRouter from "@/app/routes/auth.routes";
import userRouter from "@/app/routes/users.routes";
import vendorsRouter from "@/app/routes/vendors.routes";
import partnersRouter from "@/app/routes/partners.routes";
import ordersRouter from "@/app/routes/orders.routes";
import productsRouter from "@/app/routes/products.routes";
import bannersRouter from "@/app/routes/banners.routes";
import couponsRouter from "@/app/routes/coupons.routes";
import categoriesRouter from "@/app/routes/categories.routes";
import allergiesRouter from "@/app/routes/allergies.routes";
import { foodPreferencesRouter } from "@/app/routes/foodPreferences.routes";
import { cuisinePreferencesRouter } from "@/app/routes/cuisinePreferences.routes";

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/vendors", vendorsRouter);
apiRouter.use("/partners", partnersRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/banners", bannersRouter);
apiRouter.use("/coupons", couponsRouter);
apiRouter.use("/allergies", allergiesRouter);
apiRouter.use("/food-preferences", foodPreferencesRouter);
apiRouter.use("/cuisine-preferences", cuisinePreferencesRouter);

export default apiRouter;
