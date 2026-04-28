import { useState } from "react";
import {
  pipe,
  strictObject,
  string,
  regex,
  number,
  record,
  array,
  minLength,
  parse,
  integer,
} from "valibot";
import type { InferOutput } from "valibot";

const INITIAL_BUDGET_DATA: BudgetData = {};

export default function Home() {
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [data, setData] = useState<BudgetData | null>(null);

  function handleOpen() {
    openFile()
      .then(({ handle, data }) => {
        setHandle(handle);
        setData(data);
      })
      .catch((error) => console.error(error));
  }

  function handleNew() {
    newFile(JSON.stringify(INITIAL_BUDGET_DATA))
      .then(({ handle }) => {
        setHandle(handle);
        setData(INITIAL_BUDGET_DATA);
      })
      .catch((error) => console.error(error));
  }

  function handleSave(newData: BudgetData) {
    setData(newData); // ehhh
    if (handle === null) return;
    const text = JSON.stringify(newData);
    saveFile(handle, text).catch((error) => console.error(error));
  }

  return (
    <>
      <div>Budget Tracker</div>

      {data === null ? (
        <>
          <button onClick={handleOpen}>Open file</button>
          <button onClick={handleNew}>New file</button>
        </>
      ) : (
        <BudgetEditor initialData={data} onSave={handleSave} />
      )}
    </>
  );
}

const FILE_ACCEPT_TYPES: Array<FilePickerAcceptType> = [
  {
    description: "Json Files",
    accept: { "application/json": [".json"] },
  },
];

async function openFile(): Promise<{
  handle: FileSystemFileHandle;
  data: BudgetData;
}> {
  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    types: FILE_ACCEPT_TYPES,
  });
  const file = await handle.getFile();
  const text = await file.text();
  const raw = JSON.parse(text);
  const data = parse(BudgetDataSchema, raw);
  return { handle, data };
}

async function newFile(initialContent: string): Promise<{
  handle: FileSystemFileHandle;
}> {
  const handle = await window.showSaveFilePicker({
    suggestedName: "budget.json",
    types: FILE_ACCEPT_TYPES,
  });
  await saveFile(handle, initialContent);
  return { handle };
}

async function saveFile(handle: FileSystemFileHandle, content: string) {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

const CategorySchema = strictObject({
  name: pipe(string(), minLength(1)),
  budget: number(),
});

const ExpenseSchema = strictObject({
  dayOfMonth: pipe(number(), integer()),
  category: pipe(string(), minLength(1)),
  amount: number(),
  description: string(),
});

const MonthlyBudgetSchema = strictObject({
  totalBudget: number(),
  categories: array(CategorySchema),
  expenses: array(ExpenseSchema),
});

const MonthlySchema = strictObject({
  totalBudget: number(),
  categories: array(CategorySchema),
  expenses: array(ExpenseSchema),
});

export const YEAR_MONTH_REGEX: RegExp = /^\d{4}-(?:0[1-9]|1[0-2])$/u;
const YearMonthSchema = pipe(string(), regex(YEAR_MONTH_REGEX));

const BudgetDataSchema = record(YearMonthSchema, MonthlyBudgetSchema);

type Category = InferOutput<typeof CategorySchema>;
type Expense = InferOutput<typeof ExpenseSchema>;
type MonthlyBudget = InferOutput<typeof MonthlyBudgetSchema>;
type BudgetData = InferOutput<typeof BudgetDataSchema>;

function BudgetEditor({
  initialData,
  onSave,
}: {
  initialData: BudgetData;
  onSave: (newData: BudgetData) => void;
}) {
  function handleSave() {
    onSave({});
  }
  return (
    <>
      <label>
        Total Budget: <input type="number" />
      </label>

      <button onClick={handleSave}>Save</button>
    </>
  );
}
