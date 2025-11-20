import Link from "next/link";

export default function Home() {
  return (
      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Demo — Persons</h1>
        <div className="flex flex-col gap-2">
            <Link href="/persons" className="text-blue-600">Перейти к списку персонажей</Link>
            <Link href="/location" className="text-blue-600">Посмотреть локации и связанные персонажи</Link>
        </div>
      </main>
  );
}
