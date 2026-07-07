import { useState, useEffect, useRef, useCallback } from "react";
import { C, FONTS, STATUS_META, OVERLAYS } from "../../theme";
import type { StatusKey } from "../../theme";
import { SketchBox, SketchPill } from "../ui/SketchBox";
import {
  IconBell,
  IconCalendar,
  SketchCheck,
} from "../ui/Icons";
import { ScratchPad } from "../ui/ScratchPad";
import type { Task } from "../../types";
import { scratchpadApi } from "../../api/scratchpad";

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onOpenCalendar?: () => void;
}

const REMINDERS = [
  "10:00 am — standup",
  "2:30 pm — decide on dnd lib",
  "5:00 pm — push PR review",
];

export function TodayView({ tasks, onTaskClick, onOpenCalendar }: Props) {
  const [isFloating, setIsFloating] = useState(false);
  const [scratchContent, setScratchContent] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load today's scratchpad from backend
    scratchpadApi
      .get()
      .then((response) => {
        if (response && response.content) {
          setScratchContent(response.content);
        }
      })
      .catch(() => {});
  }, []);

  const handleScratchChange = useCallback((value: string) => {
    setScratchContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Save to backend
      scratchpadApi.save(value).catch(() => {});
    }, 5000);
  }, []);

  const toggleFloat = useCallback(() => setIsFloating((f) => !f), []);

  const todayTasks = tasks.filter(
    (t) => t.dueDate === "Today" || t.status === "proc",
  );
  const upcoming = tasks.filter(
    (t) => t.dueDate && t.dueDate !== "Today" && t.status !== "done",
  );
  const inProcess = tasks.filter((t) => t.status === "proc").length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "good morning, SampathKumar P V";
    if (h < 17) return "good afternoon, SampathKumar P V";
    return "good evening, SampathKumar P V";
  };

  return (
    <>
      {/* Blur overlay when floating */}
      {isFloating && (
        <div
          onClick={() => setIsFloating(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: OVERLAYS.blur,
            backdropFilter: "blur(4px)",
            zIndex: 100,
            cursor: "pointer",
          }}
        />
      )}

      {/* Floating scratchpad */}
      {isFloating && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 101,
          }}
        >
          <ScratchPad
            floating
            content={scratchContent}
            isFloating={isFloating}
            onToggleFloat={toggleFloat}
            onChange={handleScratchChange}
          />
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          padding: "22px 32px",
          gap: 28,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* left column */}
        <div
          style={{
            flex: 1.4,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflowY: "auto",
          }}
        >
          {/* greeting */}
          <div>
            <div
              style={{
                fontFamily: FONTS.caveat,
                fontSize: 36,
                fontWeight: 700,
                color: C.ink,
                lineHeight: 1,
              }}
            >
              {greeting()}
            </div>
            <div
              style={{
                fontFamily: FONTS.kalam,
                fontSize: 13,
                color: C.pencil,
                marginTop: 4,
              }}
            >
              {todayTasks.length} tasks today · {inProcess} in process
              {tasks.filter((t) => t.dueDate === "Today").length > 0 &&
                ` · ${tasks.filter((t) => t.dueDate === "Today").length} due today`}
            </div>
          </div>

          {/* focus list */}
          <div>
            <div
              style={{
                fontFamily: FONTS.caveat,
                fontSize: 20,
                fontWeight: 700,
                color: C.ink,
                marginBottom: 10,
              }}
            >
              Focus list
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayTasks.slice(0, 6).map((t) => {
                const statusMeta = STATUS_META[t.status as StatusKey];
                return (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t.id)}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      background: C.paper,
                      cursor: "pointer",
                      borderRadius: 4,
                    }}
                  >
                    <SketchBox
                      stroke={t.priority === "hi" ? C.coral : C.pencilLight}
                      strokeWidth={t.priority === "hi" ? 1.8 : 1.3}
                      rough={0.9}
                      radius={3}
                    />
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        zIndex: 1,
                      }}
                    >
                      <SketchCheck checked={t.status === "done"} size={14} />
                      <span
                        style={{
                          fontSize: 10,
                          color: C.pencil,
                          width: 62,
                          flexShrink: 0,
                          fontFamily: FONTS.kalam,
                        }}
                      >
                        {t.tag}
                      </span>
                      <span
                        style={{
                          fontFamily: FONTS.architects,
                          fontSize: 14,
                          flex: 1,
                          color: C.ink,
                        }}
                      >
                        {t.title}
                      </span>
                      <SketchPill color={statusMeta.color}>
                        {statusMeta.short}
                      </SketchPill>
                      {t.priority === "hi" && (
                        <span
                          style={{
                            fontFamily: FONTS.caveat,
                            fontSize: 14,
                            color: C.coral,
                          }}
                        >
                          !!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: FONTS.caveat,
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.ink,
                  marginBottom: 8,
                }}
              >
                Upcoming
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {upcoming.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onTaskClick(u.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "5px 2px",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        color: C.pencil,
                        width: 72,
                        fontFamily: FONTS.kalam,
                        flexShrink: 0,
                      }}
                    >
                      {u.dueDate}
                    </span>
                    <span
                      style={{
                        color: C.pencil,
                        width: 62,
                        fontSize: 10,
                        fontFamily: FONTS.kalam,
                        flexShrink: 0,
                      }}
                    >
                      {u.tag}
                    </span>
                    <span
                      style={{ fontFamily: FONTS.architects, color: C.inkSoft }}
                    >
                      {u.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* right rail */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflowY: "auto",
          }}
        >
          {/* scratchpad */}
          <ScratchPad
            content={scratchContent}
            isFloating={isFloating}
            onToggleFloat={toggleFloat}
            onChange={handleScratchChange}
          />

          {/* reminders */}
          <div style={{ position: "relative", padding: 14, borderRadius: 3 }}>
            <SketchBox
              stroke={C.pencilLight}
              strokeWidth={1.3}
              rough={0.8}
              radius={3}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <IconBell size={14} color={C.coral} />
                <span
                  style={{
                    fontFamily: FONTS.caveat,
                    fontSize: 17,
                    fontWeight: 700,
                    color: C.ink,
                  }}
                >
                  Reminders
                </span>
              </div>
              {REMINDERS.map((r, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: "4px 0",
                    color: C.inkSoft,
                    fontFamily: FONTS.architects,
                    borderBottom:
                      i < REMINDERS.length - 1
                        ? `1px dashed ${C.pencilLight}`
                        : "none",
                  }}
                >
                  · {r}
                </div>
              ))}
            </div>
          </div>

          {/* mini calendar hint */}
          <div style={{ position: "relative", padding: 14, borderRadius: 3 }}>
            <SketchBox
              stroke={C.pencilLight}
              strokeWidth={1.3}
              rough={0.8}
              radius={3}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <IconCalendar size={14} color={C.teal} />
                <span
                  style={{
                    fontFamily: FONTS.caveat,
                    fontSize: 17,
                    fontWeight: 700,
                    color: C.ink,
                  }}
                >
                  This week
                </span>
              </div>
              {tasks
                .filter((t) => t.dueDate && t.status !== "done")
                .slice(0, 4)
                .map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t.id)}
                    style={{
                      display: "flex",
                      gap: 8,
                      padding: "3px 0",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONTS.kalam,
                        fontSize: 10,
                        color: C.pencil,
                        width: 60,
                        flexShrink: 0,
                      }}
                    >
                      {t.dueDate}
                    </span>
                    <span
                      style={{
                        fontFamily: FONTS.architects,
                        fontSize: 11,
                        color: C.inkSoft,
                      }}
                    >
                      {t.title}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Review another day - link to Calendar */}
          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              style={{
                position: "relative",
                width: "100%",
                padding: 14,
                borderRadius: 3,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <SketchBox
                stroke={C.pencilLight}
                strokeWidth={1.3}
                rough={0.8}
                radius={3}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.caveat,
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.ink,
                    }}
                  >
                    Review another day
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.kalam,
                      fontSize: 10,
                      color: C.pencil,
                      marginTop: 2,
                    }}
                  >
                    open the calendar to browse activity
                  </div>
                </div>
                <div
                  style={{
                    color: C.coral,
                    fontFamily: FONTS.architects,
                    fontSize: 12,
                  }}
                >
                  →
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
