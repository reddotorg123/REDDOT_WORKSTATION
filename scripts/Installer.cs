using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace ReddotWorkstation
{
    static class Installer
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string sourceDir = Path.Combine(baseDir, "REDDOT-Workstation-OS-Portable");
                if (!Directory.Exists(sourceDir))
                {
                    sourceDir = Path.Combine(baseDir, "v2.5.1", "REDDOT-Workstation-OS-Portable");
                }

                if (!Directory.Exists(sourceDir))
                {
                    MessageBox.Show("Source payload directory not found: " + sourceDir, "REDDOT Installer", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string targetDir = Path.Combine(localApp, "Programs", "REDDOT-Workstation-OS");

                if (Directory.Exists(targetDir))
                {
                    try { Directory.Delete(targetDir, true); } catch { }
                }
                Directory.CreateDirectory(targetDir);

                // Copy files recursively
                CopyDirectory(sourceDir, targetDir);

                // Create Desktop Shortcut using WScript.Shell
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktop, "REDDOT Workstation OS.lnk");
                string targetExe = Path.Combine(targetDir, "REDDOT-Workstation-OS.exe");

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetExe;
                shortcut.WorkingDirectory = targetDir;
                shortcut.Description = "REDDOT Workstation OS • Production Enterprise Desktop App";
                shortcut.Save();

                // Launch installed application
                Process.Start(new ProcessStartInfo(targetExe) { WorkingDirectory = targetDir });

                MessageBox.Show("REDDOT Workstation OS has been successfully installed!\nA desktop shortcut has been created on your Windows Desktop.", "Installation Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Installation error: " + ex.Message, "REDDOT Installer", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void CopyDirectory(string sourceDir, string targetDir)
        {
            foreach (string dirPath in Directory.GetDirectories(sourceDir, "*", SearchOption.AllDirectories))
            {
                Directory.CreateDirectory(dirPath.Replace(sourceDir, targetDir));
            }
            foreach (string newPath in Directory.GetFiles(sourceDir, "*.*", SearchOption.AllDirectories))
            {
                File.Copy(newPath, newPath.Replace(sourceDir, targetDir), true);
            }
        }
    }
}
