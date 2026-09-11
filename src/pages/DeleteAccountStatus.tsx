import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { IonSpinner, IonItem, IonLabel } from "@ionic/react";
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Building } from "lucide-react";
import PageLayout from "../baseComponents/PageLayout";
import { PageHeader } from "../baseComponents/PageHeader";
import { fetchParallelDeletionRequirements, GroupedDeletionRequirementModel } from "../services/accountDeletionValidator";
import { executeAutomatedAccountPurge, resolveCurrentUserId, signOutUser } from "../auth/authUtils";
import { SettingsBlock } from "../components/SettingsBlock";
import Button from "../baseComponents/Button";
import {trashOutline}  from 'ionicons/icons';

export default function DeleteAccountStatus() {
    const { t } = useTranslation();
    const history = useHistory();
    const [runningChecks, setRunningChecks] = useState(true);
    const [executingPurge, setExecutingPurge] = useState(false);
    
    // Updated to accept the new structured grouped model signature
    const [groupedRequirements, setGroupedRequirements] = useState<GroupedDeletionRequirementModel[]>([]);

    const fetchParallelStatus = async () => {
        setRunningChecks(true);
        try {
            const userId = await resolveCurrentUserId();
            if (userId) {
                const results = await fetchParallelDeletionRequirements(
                    userId, 
                    (key: string) => t(key as unknown as TemplateStringsArray)
                );
                setGroupedRequirements(results);
            }
        } catch (err) {
            console.error("Parallel loop aborted:", err);
        } finally {
            setRunningChecks(false);
        }
    };

    useEffect(() => { fetchParallelStatus(); }, []);

    // Blocks deletion if ANY check inside ANY household block registers a false 'isPassed' profile
    const hasFailingRules = groupedRequirements.some(group => 
        group.checks.some(check => !check.isPassed)
    );

    const handleFinalPurgeAction = async () => {
        if (hasFailingRules || runningChecks || executingPurge) return;

        const absoluteVerification = window.confirm(t('delete_page.final_double_check'));
        if (!absoluteVerification) return;

        setExecutingPurge(true);
        try {
            await executeAutomatedAccountPurge();

            await signOutUser();
            localStorage.clear();
            window.location.href = "/login";
        } catch (err) {
            console.error(err);
            alert(t('delete_page.err_purge_failed'));
        } finally {
            setExecutingPurge(false);
        }
    };

    return (
      <PageLayout header={<PageHeader title={t('delete_page.title')} icon={<ShieldAlert className="w-7 h-7 text-red-500" />} onBack={() => history.goBack()} />}>
        <div className="flex flex-col gap-6 p-4 max-w-md mx-auto w-full">
            
            {/* Caution Banner Header */}
            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                    {t('delete_page.banner_text')}
                </span>
            </div>

            {runningChecks ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <IonSpinner name="crescent" color="primary" />
                    <span className="text-xs font-semibold text-gray-500 tracking-wide">{t('delete_page.loading_rules')}</span>
                </div>
            ) : (
                /* OUTER MAP: Loops through each distinct building card box */
                <div className="flex flex-col gap-6">
                    {groupedRequirements.map((group) => (
                        <div 
                            key={group.scopeId} 
                            className="flex flex-col bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm"
                        >
                            {/* Unified Card Header Banner with Building Name */}
                            <SettingsBlock title={group.scopeName} icon={<Building className="w-5 h-5" />} >

                            {/* INNER MAP: Loops row-by-row rendering checks for this building */}
                            <div className="flex flex-col divide-y divide-gray-200/40 dark:divide-gray-700/40">
                                {group.checks.map((check) => (
                                    <div key={check.id} className="flex flex-col">
                                        <IonItem lines="none" className="--background: transparent">
                                            <div slot="start" className="flex items-center justify-center mr-2">
                                                {check.isPassed ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>

                                            <IonLabel className="text-sm ion-text-wrap leading-relaxed py-2">
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-0.5">
                                                    {check.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {check.description}
                                                </p>
                                            </IonLabel>
                                        </IonItem>

                                        {/* Action instructions displayed under failing records */}
                                        {!check.isPassed && check.fixInstruction && (
                                            <div className="mx-4 mb-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200/40 dark:border-red-900/40">
                                                💡 {check.fixInstruction}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            </SettingsBlock>
                        </div>
                    ))}
                </div>
            )}

            {/* Commit Footer Action */}
            <div className="flex flex-col gap-3 mt-2">
                <Button
                    variant="danger"
                    label={t('delete_page.btn_action_purge')}
                    icon={trashOutline}
                    isLoading={executingPurge}
                    onClick={handleFinalPurgeAction}
                    disabled={hasFailingRules || runningChecks || executingPurge}
                >
                </Button>
            </div>

        </div>
      </PageLayout>
    );
}
