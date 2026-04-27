import { useState } from "react";
import {
  pipe,
  strictObject,
  string,
  number,
  array,
  minLength,
  toDate,
  parse,
} from "valibot";
import type { InferOutput } from "valibot";

const INITIAL_BUDGET_DATA: BudgetData = {
  totalBudget: 0,
  categories: [],
  expenses: [],
};

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

export const CategorySchema = strictObject({
  name: pipe(string(), minLength(1)),
  budget: number(),
});

export const ExpenseSchema = strictObject({
  category: pipe(string(), minLength(1)),
  amount: number(),
  date: pipe(string(), toDate()),
  description: string(),
});

export const BudgetDataSchema = strictObject({
  totalBudget: number(),
  categories: array(CategorySchema),
  expenses: array(ExpenseSchema),
});

export type Category = InferOutput<typeof CategorySchema>;
export type Expense = InferOutput<typeof ExpenseSchema>;
export type BudgetData = InferOutput<typeof BudgetDataSchema>;

function BudgetEditor({
  initialData,
  onSave,
}: {
  initialData: BudgetData;
  onSave: (newData: BudgetData) => void;
}) {
  const [totalBudget, setTotalBudget] = useState(initialData.totalBudget);
  const [categories, setCategories] = useState(initialData.categories);
  const [expenses, setExpenses] = useState(initialData.expenses);

  function handleSave() {
    onSave({
      totalBudget,
      categories,
      expenses,
    });
  }
  return (
    <>
      <label>
        Total Budget:{" "}
        <input
          type="number"
          value={totalBudget}
          onChange={(e) => setTotalBudget(Number(e.target.value))}
        />
      </label>

      <button onClick={handleSave}>Save</button>
    </>
  );
}
