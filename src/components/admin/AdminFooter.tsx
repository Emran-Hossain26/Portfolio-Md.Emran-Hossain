"use client";

/**
 * Admin Footer
 * Simple footer with copyright information.
 */
export function AdminFooter() {
  
  return (
    <footer className="admin-footer">
      <div className="admin-footer-content">
        <div className="admin-footer-copyright">
          © Emran Portfolio Admin. All rights reserved.
        </div>
        <div className="admin-footer-links">
          <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">Help</a>
          <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">Documentation</a>
          <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">Settings</a>
        </div>
      </div>
    </footer>
  );
}