import pandas as pd
import sys
import os

def convert_tgi_to_xlsx_and_jsonl(input_xlsx, output_xlsx=None, output_jsonl=None):
    # Définition des chemins de sortie si non précisés
    base = os.path.splitext(os.path.basename(input_xlsx))[0]
    if output_xlsx is None:
        output_xlsx = base + "_long_ALL_AVEC_TOTAL.xlsx"
    if output_jsonl is None:
        output_jsonl = base + "_long_ALL_AVEC_TOTAL.json"

    # Chargement du fichier Excel
    df = pd.read_excel(input_xlsx, sheet_name=0, header=None)
    df = df.iloc[4:].reset_index(drop=True)  # On saute les 4 premières lignes d'entête

    segments = df.iloc[0, 3:].tolist()
    rows = []

    # Bloc "Total interviewé" (lignes 6 à 10 → ici il reste 1:6)
    total_block = df.iloc[1:6, :]
    for seg_idx, segment in enumerate(segments):
        seg_col_idx = 3 + seg_idx
        label_val = dict(zip(total_block.iloc[:, 1], total_block.iloc[:, seg_col_idx]))
        rows.append({
            "Groupe_interviewé": "Total interviewé",
            "Segment": segment,
            "Echantillon": label_val.get("Echantillon"),
            "(000)": label_val.get("(000)"),
            "% Vert": label_val.get("% Vert"),
            "% Horz": label_val.get("% Horz"),
            "Indice": label_val.get("Indice"),
        })
    block_total = dict(zip(total_block.iloc[:, 1], total_block.iloc[:, 2]))
    rows.append({
        "Groupe_interviewé": "Total interviewé",
        "Segment": "Total",
        "Echantillon": block_total.get("Echantillon"),
        "(000)": block_total.get("(000)"),
        "% Vert": block_total.get("% Vert"),
        "% Horz": block_total.get("% Horz"),
        "Indice": block_total.get("Indice"),
    })

    # Blocs Interviewé: ...
    group_indices = df.index[df[0].fillna("").str.contains("Interviewé:")].tolist()
    for idx_num, idx in enumerate(group_indices):
        group_name = df.iloc[idx, 0].strip()
        if idx >= 5:
            block = df.iloc[idx-5:idx, :]
            for seg_idx, segment in enumerate(segments):
                seg_col_idx = 3 + seg_idx
                label_val = dict(zip(block.iloc[:, 1], block.iloc[:, seg_col_idx]))
                rows.append({
                    "Groupe_interviewé": group_name,
                    "Segment": segment,
                    "Echantillon": label_val.get("Echantillon"),
                    "(000)": label_val.get("(000)"),
                    "% Vert": label_val.get("% Vert"),
                    "% Horz": label_val.get("% Horz"),
                    "Indice": label_val.get("Indice"),
                })
            block_total = dict(zip(block.iloc[:, 1], block.iloc[:, 2]))
            rows.append({
                "Groupe_interviewé": f"Total interviewé : {group_name.split(':',1)[-1].strip()}",
                "Segment": "Total",
                "Echantillon": block_total.get("Echantillon"),
                "(000)": block_total.get("(000)"),
                "% Vert": block_total.get("% Vert"),
                "% Horz": block_total.get("% Horz"),
                "Indice": block_total.get("Indice"),
            })

    final_df = pd.DataFrame(rows)
    final_df.to_excel(output_xlsx, index=False)
    final_df.to_json(output_jsonl, orient='records', lines=True, force_ascii=False)
    print(f"✅ Fichier Excel généré : {output_xlsx}")
    print(f"✅ Fichier JSONL généré : {output_jsonl}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage : python convert_tgi_audi.py <fichier_excel_source>")
    else:
        convert_tgi_to_xlsx_and_jsonl(sys.argv[1])
