import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabaseClient.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ✅ LOGIN (Supabase Version)
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    const normalizedEmail = email.toLowerCase();
    console.log(`Attempting login for: [${normalizedEmail}]`);

    // 1. Supabase se user fetch karein
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      console.log(`Login failed: User not found in Supabase. Error:`, error);
      return res.status(400).json({ msg: "User not found" });
    }
    console.log(`User found: ${user.email} (ID: ${user.id})`);

    // 2. Password Match check karein
    let isMatch = false;
    // Agar password hashed hai (starts with $2)
    if (user.password.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Plain text support (sirf development ke liye)
      isMatch = (password === user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    // 3. JWT Token generate karein
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    // 4. Response (id aur _id dono bhej rahe hain compatibility ke liye)
    res.json({
      token,
      user: {
        id: user.id,
        _id: user.id, 
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ ADMIN CREATE USER (Supabase Version)
router.post("/create-user", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (exists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role }])
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({
      id: user.id,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ GET ALL SALES USERS
router.get("/sales-users", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, status')
      .ilike('role', 'sales')
      .neq('status', 'deleted');

    if (error) throw error;
    res.json(users.map(u => ({ ...u, _id: u.id }))); // _id mapping
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ GET ALL PRODUCTION USERS
router.get("/production-users", protect, authorizeRoles("admin", "sales"), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .ilike('role', 'production');

    if (error) throw error;
    res.json(users.map(u => ({ ...u, _id: u.id }))); // _id mapping
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;