import { supabase } from "../lib/supabase";

// Represents a single granular rule row
export interface GranularCheckItem {
  id: string;
  title: string;
  description: string;
  isPassed: boolean;
  fixInstruction: string | null;
}

// Represents the grouped building/household profile package
export interface GroupedDeletionRequirementModel {
  scopeId: string;
  scopeName: string;
  checks: GranularCheckItem[];
}

type PureTranslationFn = (key: string) => string;

export const fetchParallelDeletionRequirements = async (
  userId: string,
  t: PureTranslationFn
): Promise<GroupedDeletionRequirementModel[]> => {
  
  const { data: memberships, error: memError } = await supabase
    .from("memberships")
    .select("household_id, apartment_id, household_role, apartment_role, household(name), apartment(display_name)")
    .eq("user_id", userId);

  if (memError) throw memError;
  if (!memberships || memberships.length === 0) return [];

  // Map each space membership into a distinct grouped entry packet concurrently
  const checkPromises = memberships.map(async (mem) => {
    const householdId = mem.household_id;
    const apartmentId = mem.apartment_id;
    const buildingName = (mem.household as { name: string })?.name || "Building";
    const apartmentName = (mem.apartment as { display_name: string })?.display_name || "Apartment";
    
    const granularChecks: GranularCheckItem[] = [];

    // --- TRACK A: HOUSEHOLD (BUILDING) EVALUATIONS ---
    const { data: otherHouseMembers, error: houseError } = await supabase
      .from("memberships")
      .select("user_id, household_role")
      .eq("household_id", householdId)
      .neq("user_id", userId);

    if (houseError) throw houseError;

    const totalOtherHouseMembers = otherHouseMembers?.length || 0;
    const hasOtherHouseAdmin = otherHouseMembers?.some(m => m.household_role === "admin") || false;

    // Check 1: User is not sole admin of the building
    const isSoleHouseAdmin = mem.household_role === "admin" && totalOtherHouseMembers > 0 && !hasOtherHouseAdmin;
    granularChecks.push({
      id: `house-admin-${householdId}`,
      title: t("delete_checks.house_admin_title"), 
      description: isSoleHouseAdmin ? t("delete_checks.house_admin_fail") : t("delete_checks.house_admin_pass"),
      isPassed: !isSoleHouseAdmin,
      fixInstruction: isSoleHouseAdmin ? t("delete_checks.house_admin_fix") : null
    });

    // Check 2: Building member footprint evaluation (Lone member status)
    const isLoneHouseMember = totalOtherHouseMembers === 0;
    granularChecks.push({
      id: `house-lone-${householdId}`,
      title: t("delete_checks.house_lone_title"),
      description: isLoneHouseMember ? t("delete_checks.house_lone_true") : t("delete_checks.house_lone_false"),
      isPassed: true, 
      fixInstruction: null
    });

    // --- TRACK B: APARTMENT EVALUATIONS (IF ASSIGNED) ---
    if (apartmentId) {
      const { data: otherApartmentMembers, error: aptError } = await supabase
        .from("memberships")
        .select("user_id, apartment_role")
        .eq("apartment_id", apartmentId)
        .neq("user_id", userId);

      if (aptError) throw aptError;

      const totalOtherAptMembers = otherApartmentMembers?.length || 0;
      const hasOtherAptAdmin = otherApartmentMembers?.some(m => m.apartment_role === "admin") || false;

      // Check 3: User is not sole admin of the apartment
      const isSoleAptAdmin = mem.apartment_role === "admin" && totalOtherAptMembers > 0 && !hasOtherAptAdmin;
      granularChecks.push({
        id: `apt-admin-${apartmentId}`,
        title: `${apartmentName}: ${t("delete_checks.apt_admin_title")}`,
        description: isSoleAptAdmin ? t("delete_checks.apt_admin_fail") : t("delete_checks.apt_admin_pass"),
        isPassed: !isSoleAptAdmin,
        fixInstruction: isSoleAptAdmin ? t("delete_checks.apt_admin_fix") : null
      });

      // Check 4: Apartment member footprint evaluation (Lone member status)
      const isLoneAptMember = totalOtherAptMembers === 0;
      granularChecks.push({
        id: `apt-lone-${apartmentId}`,
        title: `${apartmentName}: ${t("delete_checks.apt_lone_title")}`,
        description: isLoneAptMember ? t("delete_checks.apt_lone_true") : t("delete_checks.apt_lone_false"),
        isPassed: true,
        fixInstruction: null
      });
    }

    // Return the single structured group package for this physical building environment
    return {
      scopeId: householdId,
      scopeName: buildingName,
      checks: granularChecks
    };
  });

  return Promise.all(checkPromises);
};
