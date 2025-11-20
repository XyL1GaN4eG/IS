import CreatePersonForm from "@/src/components/CreatePersonForm";

export default function CreatePersonPage() {
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-4">Создание персонажа</h1>
            <CreatePersonForm />
        </div>
    )
}
