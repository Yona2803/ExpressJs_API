import os
import tempfile
import nibabel as nb
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from decimal import Decimal, getcontext
import pandas as pd
import sys
import shutil

getcontext().prec = 4


def process_images(file1_path, file2_path, id_Patient, Date_Nais_Patient):
    userInfos = [id_Patient, Date_Nais_Patient]
    files = [file1_path, file2_path]
    volumes = []

    for file_path in files:
        img = nb.load(file_path)
        data = img.get_fdata()
        num_vox = np.count_nonzero(data)
        voxel_vol = np.prod(img.header.get_zooms())
        num_vox = float(num_vox)
        voxel_vol = float(voxel_vol)
        tumor_vol = Decimal(num_vox) * Decimal(voxel_vol)
        volumes.append(tumor_vol)

    delta_vol = volumes[1] - volumes[0]

    DV_T = delta_vol
    VT_1 = volumes[1]
    VT_2 = volumes[0]

    file_names_display = ["Volume avant la séance", "Volume après la séance"]

    volume_data = {
        "Fichier": file_names_display,
        "Volume Tumoral (mm³)": [float(vol) for vol in volumes],
    }

    df_volumes = pd.DataFrame(volume_data)

    df_difference = pd.DataFrame(
        {
            "Fichier": ["Différence de Volume"],
            "Volume Tumoral (mm³)": [float(delta_vol)],
        }
    )

    df_volumes = pd.concat([df_volumes, df_difference], ignore_index=True)

    with tempfile.TemporaryDirectory() as temp_dir:
        pdf_path = os.path.join(temp_dir, "thePDF.pdf")
        with PdfPages(pdf_path) as pdf:
            fig = plt.figure(figsize=(8.27, 11.69))  # A4 size

            ax1 = fig.add_subplot(3, 1, 1)
            ax1.axis("tight")
            ax1.axis("off")

            patient_info = [
                ["id Patient: ", userInfos[0]],
                ["Date naissance: ", userInfos[1]],
            ]
            table_patient_info = ax1.table(
                cellText=patient_info, cellLoc="center", loc="center"
            )
            table_patient_info.auto_set_font_size(False)
            table_patient_info.set_fontsize(8)

            title = "Rapport Séance Numero i"  # Vous pouvez remplacer i par la valeur actuelle
            ax1.set_title(title, fontsize=14, fontweight="bold", pad=10)

            ax2 = fig.add_subplot(3, 1, 2)

            bar_width = 0.35
            opacity = 0.8
            index = np.arange(len(file_names_display))
            rects1 = ax2.bar(
                index,
                volumes,
                bar_width,
                alpha=opacity,
                color="b",
                label="Volume Tumoral",
            )

            ax2.set_xlabel("RESULTATS")
            ax2.set_ylabel("Volume Tumoral (mm³)")
            ax2.set_title("Volume Tumoral Avant et Après la Séance")
            ax2.set_xticks(index)
            ax2.set_xticklabels(file_names_display)
            ax2.legend()

            for i, rect in enumerate(rects1):
                height = rect.get_height()
                ax2.text(
                    rect.get_x() + rect.get_width() / 2.0,
                    height,
                    "{:.2f}".format(height),
                    ha="center",
                    va="bottom",
                )

            ax3 = fig.add_subplot(3, 1, 3)
            ax3.axis("tight")
            ax3.axis("off")
            table_volumes = ax3.table(
                cellText=df_volumes.values,
                colLabels=df_volumes.columns,
                cellLoc="center",
                loc="top",
            )

            table_volumes.auto_set_font_size(False)
            table_volumes.set_fontsize(8)

            table_volumes.auto_set_column_width(
                col=list(range(len(df_volumes.columns)))
            )
            cell_state = table_volumes[3, 0]
            cell_state.get_text().set_text(
                "Difference de Volume ".format(abs(float(delta_vol)))
            )

            if delta_vol > 0:
                state_text = "État en Évolution ------ delta V = {:.4f} mm³".format(
                    abs(float(delta_vol))
                )
            elif delta_vol < 0:
                state_text = "État Se Dégrade ".format(abs(float(delta_vol)))
            else:
                state_text = "Aucun changement dans le volume tumoral."

            fig.text(
                0.5,
                0.1,
                state_text,
                fontsize=10,
                fontweight="bold",
                color="blue",
                ha="center",
            )

            plt.tight_layout()
            pdf.savefig(fig)

        # Copy the PDF to a persistent location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        exported_dir = os.path.join(script_dir, "Exported")
        if not os.path.exists(exported_dir):
            os.makedirs(exported_dir)
        persistent_pdf_path = os.path.join(exported_dir, "thePDF.pdf")
        shutil.copy(pdf_path, persistent_pdf_path)
        print(f"{DV_T},{VT_1},{VT_2},{persistent_pdf_path}")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(
            "Usage: python theCode.py <file1_path> <file2_path> <id_Patient> <Date_Nais_Patient>"
        )
        sys.exit(1)

    file1_path = sys.argv[1]
    file2_path = sys.argv[2]
    id_Patient = sys.argv[3]
    Date_Nais_Patient = sys.argv[4]

    try:
        process_images(file1_path, file2_path, id_Patient, Date_Nais_Patient)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
