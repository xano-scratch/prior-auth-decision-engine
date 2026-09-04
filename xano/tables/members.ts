import { table, f } from "@xanots/sdk";

/** The covered patient a request is filed for. */
export const members = table({
  name: "members",
  schema: {
    member_number: f.text({ required: true }),
    first_name: f.text({ required: true }),
    last_name: f.text({ required: true }),
    plan: f.enum(["hmo", "ppo", "medicare_advantage"], { required: true }),
    // An inactive member is refused at submit time, before any rule runs.
    active: f.bool({ required: true }),
  },
  index: [{ type: "unique", fields: [{ name: "member_number" }] }],
  seed: [
    { id: 1, member_number: "M100001", first_name: "Alice", last_name: "Nguyen", plan: "ppo", active: true },
    { id: 2, member_number: "M100002", first_name: "Bruno", last_name: "Carter", plan: "hmo", active: true },
    { id: 3, member_number: "M100003", first_name: "Carol", last_name: "Diaz", plan: "medicare_advantage", active: true },
    { id: 4, member_number: "M100004", first_name: "Dan", last_name: "Ellis", plan: "ppo", active: false },
  ],
});
