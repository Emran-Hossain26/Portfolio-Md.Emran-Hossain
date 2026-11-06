"use client";

/**
 * Admin Header
 * Shows user profile information in the top right corner.
 */
export function AdminHeader() {
  return (
    <header className="admin-header">
      <div className="admin-header-right">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-700">engremran.it@gmail.com</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">
          E
        </div>
      </div>
    </header>
  );
}