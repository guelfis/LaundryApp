export default function SectionText({ title, classname }: { title: string, classname?:string }) {
    return (
        <h2 className={`text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 ml-4 mb-2 ${classname}`}>
            {title}
        </h2>
    )
}