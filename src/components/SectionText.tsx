export default function SectionText({ title }: { title: string }) {
    return (
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 ml-4 mb-2">
            {title}
        </h2>
    )
}