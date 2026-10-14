import mongoose from "mongoose";

async function main() {
  await mongoose.connect("mongodb://localhost:27017/auth_db");
  const db = mongoose.connection.db;

  const sufyan = await db.collection("staffs").findOne({ email: "sufyan@gmail.com" });
  console.log("Found sufyan:", sufyan?.name, sufyan?._id);

  if (sufyan) {
    const res = await db.collection("deals").updateMany(
      {},
      {
        $set: {
          assignedTo: sufyan._id,
          agentEmail: "sufyan@gmail.com",
          agentName: sufyan.name
        }
      }
    );
    console.log("Modified deals:", res.modifiedCount);

    // Also update Sufyan's totalValue and dealsClosed in staffs
    await db.collection("staffs").updateOne(
      { _id: sufyan._id },
      {
        $set: {
          dealsClosed: 3,
          totalValue: 57300,
          servicesOffered: [
            "Enterprise Cloud CRM Migration & Setup",
            "Meta Leadgen & Instant Forms Ingestion",
            "Custom Multi-Agent AI Workflow Engine",
            "Workflow Automation & WhatsApp VoIP Connect"
          ]
        }
      }
    );
  }

  const deals = await db.collection("deals").find({ assignedTo: sufyan._id }).toArray();
  console.log("Assigned deals for Sufyan:", deals.map(d => ({ title: d.title, amount: d.amount, stage: d.stage })));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
