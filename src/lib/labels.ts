export const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: 'Stała',
  part_time: 'Dorywcza',
}

export const AGE_RANGE_LABEL: Record<string, string> = {
  under_1: '<1 roku',
  '1_3': '1-3 lata',
  '4_6': '4-6 lat',
  '7_11': '7-11 lat',
  over_11: '>11 lat',
}

export const REPORT_REASON_LABEL: Record<string, string> = {
  inappropriate_content: 'Nieodpowiednie treści',
  harassment: 'Nękanie / obraźliwe zachowanie',
  fraud: 'Oszustwo / wyłudzenie',
  fake_profile: 'Fałszywy profil',
  other: 'Inne',
}

export const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: 'Oczekujące',
  resolved: 'Rozwiązane',
  dismissed: 'Odrzucone',
}
