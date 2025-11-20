"use client"
import React, { ReactNode, useEffect } from "react";
import ReactDOM from "react-dom";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
    // Не рендерим ничего, если закрыто
    if (!isOpen) return null;

    // Блокировать скролл фона
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    // Закрытие при нажатии Esc
    useEffect(() => {
        function onKey(evt: KeyboardEvent) {
            if (evt.key === "Escape") {
                onClose();
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Контейнер в body через портал
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white p-4 rounded shadow-lg max-w-full max-h-full overflow-auto"
                onClick={e => e.stopPropagation()}  // чтобы клик внутри не закрывал
            >
                {children}
            </div>
        </div>,
        document.body
    );
}
