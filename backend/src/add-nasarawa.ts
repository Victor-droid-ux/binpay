import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { User, State } from "./models";

dotenv.config();

const nasarawa = {
  name: "Nasarawa",
  code: "nasarawa",
  capital: "Lafia",
  authorityName: "NASEMA",
  authorityFullName: "Nasarawa State Environmental Management Agency",
  authorityWebsite: "https://nasarawastate.gov.ng",
  authorityPhone: "+234 849 456 7890",
  authorityEmail: "info@nasema.gov.ng",
  headquarters: "Lafia",
  binIdFormat: "NA######",
  billCycle: "monthly",
  averageBill: 300000,
  monthlyBillAmount: 1100,
  isActive: true,
  lgas: [
    "Akwanga",
    "Awe",
    "Doma",
    "Karu",
    "Keana",
    "Keffi",
    "Kokona",
    "Lafia",
    "Nasarawa",
    "Nasarawa Egon",
    "Obi",
    "Toto",
    "Wamba",
  ].map((name) => ({ name })),
  zones: ["Lafia", "Keffi", "Akwanga", "Nasarawa", "Doma"].map((name) => ({
    name,
  })),
};

async function run() {
  try {
    await connectDatabase();

    const existing = await State.findOne({ code: nasarawa.code });
    if (existing) {
      console.log("Nasarawa state already exists, skipping.");
    } else {
      await State.create(nasarawa);
      console.log("State created: Nasarawa");
    }

    const adminEmail = `admin@${nasarawa.code}.binpay.ng`;
    if (await User.findOne({ email: adminEmail })) {
      console.log("Nasarawa admin already exists, skipping.");
    } else {
      const password = process.env.SUPER_ADMIN_PASSWORD || "Admin123!@#";
      await User.create({
        email: adminEmail,
        phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: await bcrypt.hash(password, 10),
        firstName: nasarawa.name,
        lastName: "Admin",
        role: "STATE_ADMIN",
        stateCode: nasarawa.code,
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
      });
      console.log(`State admin created: ${adminEmail}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
}

run();
