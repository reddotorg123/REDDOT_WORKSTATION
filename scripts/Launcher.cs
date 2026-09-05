using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace ReddotWorkstation
{
    static class Launcher
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                
                // Search for the standalone binary in known relative paths
                string[] candidates = new string[]
                {
                    Path.Combine(baseDir, "app", "v2.5.1", "REDDOT-Workstation-OS-Portable", "REDDOT-Workstation-OS.exe"),
                    Path.Combine(baseDir, "v2.5.1", "REDDOT-Workstation-OS-Portable", "REDDOT-Workstation-OS.exe"),
                    Path.Combine(baseDir, "REDDOT-Workstation-OS-Portable", "REDDOT-Workstation-OS.exe"),
                    Path.Combine(baseDir, "v2.5.1", "REDDOT-Workstation-OS-win32-x64", "REDDOT-Workstation-OS.exe"),
                    Path.Combine(baseDir, "REDDOT-Workstation-OS-win32-x64", "REDDOT-Workstation-OS.exe")
                };

                string target = null;
                foreach (string c in candidates)
                {
                    if (File.Exists(c))
                    {
                        target = c;
                        break;
                    }
                }

                if (target == null)
                {
                    MessageBox.Show("Could not locate REDDOT Workstation OS binary in this folder.", "REDDOT Workstation OS", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }


                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = target;
                psi.WorkingDirectory = Path.GetDirectoryName(target);
                psi.UseShellExecute = true;
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to launch application: " + ex.Message, "REDDOT Workstation OS", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
