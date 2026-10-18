import React, { useState } from 'react';
import { Terminal, Copy, Check, Trash2 } from 'lucide-react';
import { AudioLogEntry } from '../types/audio';

interface AudioLogViewerProps {
  logs: AudioLogEntry[];
  onClear: () => void;
}

export const AudioLogViewer: React.FC<AudioLogViewerProps> = ({ logs, onClear }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = () => {
    if (logs.length === 0) return;
    const text = logs
      .map((l) => `[${l.time}] (Vol:${l.volumeDb}dB, Freq:${l.frequency}Hz, Note:${l.noteName ?? 'None'}, Gate:${l.isGateOpen ? 'Open' : 'Closed'}) ${l.message}`)
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy logs:', err);
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-950/90 rounded-2xl border border-slate-800 p-4 font-mono text-xs shadow-xl">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>실시간 오디오 스트림 로그 ({logs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition disabled:opacity-40"
            title="대화창에 붙여넣을 수 있도록 로그를 복사합니다"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">로그 복사</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={logs.length === 0}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition disabled:opacity-40"
            title="로그 비우기"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-44 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-8">
            마이크를 켜거나 키보드를 누르면 실시간 오디오 로그가 여기에 기록됩니다.
          </div>
        ) : (
          logs.map((log) => {
            let color = 'text-slate-400';
            if (log.message.includes('🎯')) color = 'text-emerald-300 font-bold bg-emerald-950/30 px-1 rounded';
            else if (log.message.includes('🎹')) color = 'text-purple-300 bg-purple-950/30 px-1 rounded';
            else if (log.message.includes('❌')) color = 'text-rose-400 font-bold';
            else if (log.message.includes('🎙️')) color = 'text-cyan-300';
            else if (log.message.includes('⚙️')) color = 'text-amber-300';

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0 text-[10px]">{log.time}</span>
                <span className={`${color} break-all`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
      <div className="pt-2 mt-2 border-t border-slate-900 text-[10px] text-slate-500 flex justify-between">
        <span>* 볼륨이 게이트보다 작으면 음표 분석이 실행되지 않습니다.</span>
        <span>최신순 정렬</span>
      </div>
    </div>
  );
};
