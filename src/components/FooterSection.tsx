import Button from "./Button";

export default function FooterSection({buttonLabel, onButtonClick, buttonIcon, text}: { buttonLabel: string; onButtonClick: () => void; buttonIcon?: React.ReactNode; text: React.ReactNode }) {
    return (
        <div className="w-full px-4 py-4">
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4 mb-2">
                {text}
            </p>
            <Button label={buttonLabel} onClick={onButtonClick} icon={buttonIcon} />
        </div>
    );
}