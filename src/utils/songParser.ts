/**
 * Kids Piano Journey - 간이 텍스트/JSON 기반 악보 파서
 * 음이름과 박자 튜플 배열을 받아 자동으로 비트 누적, 손가락 번호,
 * 붐웨커 표준 무지개 컬러, 한글 계이름을 매핑하여 SheetNote[] 및 SongMetadata를 생성
 */

import { SongMetadata, SheetNote, NotePitch } from '../types/sheet';

/**
 * C4~C5 1옥타브 음표 메타데이터 매핑 (손가락 기본값, 한글 계이름, 붐웨커 무지개 컬러)
 * 
 * [손가락 기본값 교육 표준 규격]:
 * - C4~G4: 오른손 5손가락 기본 자리 (도:1, 레:2, 미:3, 파:4, 솔:5)
 * - A4~C5: 스케일 확장 시 엄지 넘김(Thumb-under) 표준 운지법에 따라 A4:1, B4:2, C5:3 할당
 *   (특정 곡에서 새끼손가락 확장 5번이나 다른 운지가 필요한 경우 SongNoteTuple의 3번째 인자로 오버라이드)
 */
export const NOTE_META_MAP: Record<NotePitch, { finger: number; solfege: string; color: string }> = {
  C4: { finger: 1, solfege: '도', color: '#EF4444' }, // Red (가온 도)
  D4: { finger: 2, solfege: '레', color: '#F97316' }, // Orange (레)
  E4: { finger: 3, solfege: '미', color: '#EAB308' }, // Yellow (미)
  F4: { finger: 4, solfege: '파', color: '#22C55E' }, // Green (파)
  G4: { finger: 5, solfege: '솔', color: '#06B6D4' }, // Cyan/Blue (솔)
  A4: { finger: 1, solfege: '라', color: '#6366F1' }, // Indigo (라 - 스케일 엄지 넘김 기본값)
  B4: { finger: 2, solfege: '시', color: '#A855F7' }, // Purple (시)
  C5: { finger: 3, solfege: '도', color: '#EF4444' }, // Red (높은 도)
};

/**
 * 악보 음표 간이 정의 튜플: [음이름, 박자길이(1=4분음표), 권장손가락(선택)]
 * 예: ["C4", 1] 또는 ["G4", 2, 5]
 */
export type SongNoteTuple = [pitch: NotePitch, duration: number, finger?: number];

export interface CreateSongConfig {
  id: string;
  title: string;
  composer: string;
  bpm: number;
  beatsPerMeasure?: number;
  totalMeasures?: number;
  difficulty?: '★☆☆' | '★★☆' | '★★★';
  description?: string;
  icon?: string;
  themeColor?: string;
  accompanimentChords?: Array<'C' | 'G7'>;
  notes: SongNoteTuple[];
}

/**
 * 간이 튜플 배열을 표준 SongMetadata 및 SheetNote[]로 자동 변환하는 파서 함수
 */
export function createSong(config: CreateSongConfig): SongMetadata {
  const beatsPerMeasure = config.beatsPerMeasure ?? 4;
  let currentBeat = 0;

  const notes: SheetNote[] = config.notes.map((tuple, index) => {
    const [pitch, duration, explicitFinger] = tuple;
    const meta = NOTE_META_MAP[pitch] || {
      finger: 1,
      solfege: '도',
      color: '#EF4444',
    };

    const beat = currentBeat;
    currentBeat += duration;

    return {
      id: `${config.id}-${index}-${pitch}-${beat}`,
      pitch,
      stepIndex: index,
      beat,
      duration,
      finger: explicitFinger !== undefined ? explicitFinger : meta.finger,
      solfege: meta.solfege,
      color: meta.color,
      hit: false,
    };
  });

  const calculatedMeasures = Math.max(1, Math.ceil(currentBeat / beatsPerMeasure));
  const totalMeasures = config.totalMeasures ?? calculatedMeasures;

  return {
    id: config.id,
    title: config.title,
    composer: config.composer,
    bpm: config.bpm,
    beatsPerMeasure,
    totalMeasures,
    difficulty: config.difficulty,
    description: config.description,
    icon: config.icon,
    themeColor: config.themeColor,
    accompanimentChords: config.accompanimentChords,
    notes,
  };
}
