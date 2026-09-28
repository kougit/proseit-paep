# IB2-FOUNDATION-COMPONENTS — Design Handoff Reference (IB2-AC02)

Measured on the final code commit (`logs/verification-6dc71cc/`) on 2026-09-27 with `sha256sum`. Handoff location: `evidence/design-handoff/HOF-IB2-001/` (DCH §9.1 controlled structure). Status: PASS (technical) for S01; the design approval itself is the PO/SA's, recorded below from the manifest.

## 1. Identity

| Field | Value | Source |
| --- | --- | --- |
| Handoff | HOF-IB2-001 | manifest `handoffId` |
| Version | 1.1 | manifest `version`; `designApproval.approvedVersion` |
| Status | `APPROVED_FOR_IMPLEMENTATION` (DCH: "APPROVED FOR IMPLEMENTATION") | manifest `status`, `dchStatus` |
| Design Work Package | DWP-IB2-001 v1.0, "PAEP Design Foundations, Core Components and UI Laboratory" | manifest `dwpId`, `dwpVersion`, `designWorkPackageTitle` |
| Approved by / date | Product Owner / Solutions Architect, 2026-09-27 | manifest `designApproval.approvedBy`, `approvedDate`; WORK_PACKAGE.md l.4; work-package.json `design_handoff` |
| Decision | "PO/SA APPROVAL: GRANTED - APPROVED_FOR_IMPLEMENTATION" | manifest `designApproval.decision` |
| Approved values | brand primary `#24364B`, brand accent `#D4A62A`; protected semantic tokens approved and non-overridable; component scope 25/25; open design decisions none; deviations none | manifest `designApproval`; WORK_PACKAGE.md l.4 |
| Revision history | v1.0 2026-09-26 READY_FOR_PO_SA_REVIEW → PO/SA "CHANGES REQUESTED - BRAND REVISION" → v1.1 2026-09-27 READY_FOR_FINAL_PO_SA_APPROVAL → v1.1 APPROVED_FOR_IMPLEMENTATION | manifest `revisionHistory`, `poSaReview` |
| Repository base | `kougit/proseit-paep` `d33ab91`, Generation 3 ACCEPTED | manifest `repositoryBase` |
| Open decisions | 21 (OD-01..OD-21), all APPROVED (PO/SA 2026-09-27, v1.1); none blocking | manifest `openDecisions`, `openDecisionsBlockingImplementation` |
| Deviations | none (`unresolvedDeviations: []`; `deviations/README.md` "None") | manifest; `design-export/deviations/README.md` |

## 2. Manifest hash

| File | Bytes | sha256 |
| --- | --- | --- |
| `evidence/design-handoff/HOF-IB2-001/handoff.manifest.yaml` | 35982 | `24e7049dd675e2025ae75c099637fd3f0a9eb9f24ff2958d1ce88607d040ac53` |
| `evidence/design-handoff/HOF-IB2-001/design-export/handoff.manifest.yaml` (copy inside the export) | 35982 | `24e7049dd675e2025ae75c099637fd3f0a9eb9f24ff2958d1ce88607d040ac53` (byte-identical) |

The value equals `HANDOFF.manifestSha256` in `tooling/design-system/design-system-qa.mjs`.

## 3. How S01 enforces it

`npm run qa:design-system` S01 (`tooling/design-system/design-system-qa.mjs`):

1. fails if `evidence/design-handoff/HOF-IB2-001/handoff.manifest.yaml` is missing;
2. hashes the manifest and fails unless the sha256 equals the pinned `HANDOFF.manifestSha256` (`24e7049d…40ac53`);
3. fails unless the manifest has the line `status: APPROVED_FOR_IMPLEMENTATION` and the line `version: '1.1'`;
4. reads `evidence/design-handoff/HOF-IB2-001/HANDOFF-FILES.sha256` (176 lines, `sha256  path`) and, for every file under `design-export/` and `requirements/`, fails if the file is not listed or its sha256 (raw bytes) differs; it also fails if a listed file is missing.

Result on the working tree: `PASS S01 … manifest sha256 24e7049dd675…, APPROVED_FOR_IMPLEMENTATION; 176 handoff files pinned`. An independent `sha256sum -c HANDOFF-FILES.sha256` also passes, and the 174 `design-export/` lines equal the hashes in §5 below.

| Negative (`qa:design-system:negative`, 49/49 PASS) | Mutation | Required result |
| --- | --- | --- |
| N01 | manifest status set to `DRAFT` | S01 fails |
| N03 | `token-values.candidate.json` primary `#24364B` → `#24364C` | S01 fails (file no longer matches its pin); S02 must fail with it |
| N32 | unpinned file `design-export/extra-screen.md` added | S01 fails ("not in the pinned list") |
| N34 | handoff file and its pin line edited together | S01 fails (`HANDOFF-FILES.sha256` no longer matches its pinned sha256) |

| Pin file | sha256 (working tree) |
| --- | --- |
| `evidence/design-handoff/HOF-IB2-001/HANDOFF-FILES.sha256` | `0e340d5af4f77ac167d3626bf422249c13951bcf83b9bf91c5f384fbb00e7a38` |

Related bindings: S02 regenerates the token outputs from `token-values.candidate.json` and compares `PAEP_BREAKPOINTS` with its `breakpoints` (N02, N33); S08 requires the message catalogue to equal `design-export/content-keys.md` (N23).

**Resolved limit:** S01 now also hashes `HANDOFF-FILES.sha256` itself against `HANDOFF.fileHashesSha256` in the script (`0e340d5a…e7a38`), so a change that edits a handoff file and its pin line together fails S01 (N34). DCH §9.2(iii) requires a version increment or deviation record for any such change.

## 4. Manifest references

The manifest references 154 distinct relative file paths. 153 exist under `design-export/`. The remaining one is now retained:

| Reference | Manifest key | Status |
| --- | --- | --- |
| `ib2/design-preparation/01-DESIGN-PREPARATION.md` | `requirementsSource` (§5) | **Resolved.** Retained as `evidence/design-handoff/HOF-IB2-001/requirements/01-DESIGN-PREPARATION.md` (27,086 bytes, sha256 `4f0a065e7c99fd523cf45989f5023522461ce5394bff2021e94d4b7884b4596f`), byte-identical to the git-ignored `tmp/IB2-design-preparation/01-DESIGN-PREPARATION.md` (`diff`, no output), with `requirements/README.md` (sha256 `2f6ebe2a7fcd086fd823b63e8f13da634b52cc6cb9168392acb819f792849474`) explaining the copy. Both are pinned in `HANDOFF-FILES.sha256`. The manifest path itself is unchanged (the manifest is approved and pinned). |

21 export files are present but not referenced by the manifest (column "In manifest" = no): the DWP brief, component map, decision record, `deviations/README.md`, the manifest copy and the 16 files of `provenance/generator/`. All 21 are pinned.

## 5. Export inventory

174 files, 25,683,629 bytes, under `evidence/design-handoff/HOF-IB2-001/design-export/` (plus the two `requirements/` files in §4; 176 pinned in total):

| Folder | Files |
| --- | --- |
| top level (`*.md`, manifest copy) | 12 |
| `assets/icons/` (25 icons + sprite) | 26 |
| `deviations/` | 1 |
| `foundation/` (`token-values.candidate.json`, `token-values.md`, `prototype-reference.css`) | 3 |
| `provenance/` (`design-prompt.txt`) and `provenance/generator/` | 1 + 16 |
| `screens/` (HTML prototypes, `render-check.json`) | 29 |
| `screens/renders/` (PNG renders) | 86 |

Prototype HTML/CSS is reference material only (DCH §9.2(v); `design-export/provenance.md` §8). Paths are relative to `design-export/`.

| File | Bytes | sha256 | In manifest |
| --- | --- | --- | --- |
| `accessibility-intent.md` | 5942 | `f0a787adf5450b94814dd2854c01e4595dac7bd23ed07d6fe2d3ac328cbf7057` | yes |
| `approvals.md` | 4060 | `e2e6f14458a2b0f03c692855db13a202db132a945028b57653c53edce6c07a83` | yes |
| `assets/icons/paep-icon-check.svg` | 8100 | `349e143c4f18cf80c4a80f92ad3676d54bf61a4e8148cc88ee8953e710e9d34e` | yes |
| `assets/icons/paep-icon-chevron-down.svg` | 8110 | `cf787e8584cb8bcfc9c562ecccd05eeb547ff0f79507e2dabfc31f211f4a781f` | yes |
| `assets/icons/paep-icon-chevron-end.svg` | 8108 | `07d8f85abf4620c80bca1f5e1825800195bc06c0156bc4578ca98500abc00026` | yes |
| `assets/icons/paep-icon-chevron-start.svg` | 8114 | `4e7efef93a822fd400dc0b6f41a379db9f3e38914cb950a70fe29cc6bbe7f42f` | yes |
| `assets/icons/paep-icon-chevron-up.svg` | 8107 | `c25d742de1534287ca121ed6bcc697fc834c11fb11113727d6ffbb81c0ef49e9` | yes |
| `assets/icons/paep-icon-close.svg` | 8104 | `2912d8486bc7be72b57a8de016514057bafdd873ab2564a9a8c8aab2fd23f205` | yes |
| `assets/icons/paep-icon-contents.svg` | 8113 | `79c6dc8a08346a71bc92453dafe1cb5b0b1fc13877e060c59cb08d22874aed92` | yes |
| `assets/icons/paep-icon-delete.svg` | 8145 | `47fbd74d4e9c94f3cee0d522e9bd6a4ef82d6d35c2a90addfc09fbb60dcac0e7` | yes |
| `assets/icons/paep-icon-empty.svg` | 8142 | `be6e55dc9d0a37ff10eb9b36e3fd71a228c89e6c74667ad4fdd4f177f08cc391` | yes |
| `assets/icons/paep-icon-error.svg` | 8220 | `875385d4418dbd72752bb060a124b76cafe6c1e58d09569b15a4f399123ab393` | yes |
| `assets/icons/paep-icon-external.svg` | 8169 | `8646554df1b92388f08edd5483f66d0c5487adb2beb381d59d08cba963b058db` | yes |
| `assets/icons/paep-icon-info.svg` | 8191 | `f19b380a5b5ed7c624abee21084222b3851a304b512b4b6150ee2f35831a7b32` | yes |
| `assets/icons/paep-icon-minus.svg` | 8092 | `26c2e8f970819e24de92632e7c9a15e5cf095ba7fc4485d3c3c171c225f9a165` | yes |
| `assets/icons/paep-icon-more.svg` | 8274 | `52dea2d89c1a666b7ddc1ad28d4f5c8a8d9cc1375c8963d6972bf7eb811ee56b` | yes |
| `assets/icons/paep-icon-neutral.svg` | 8128 | `b9a5a6c32b2f4f6fed31b86e6c1c916b4feea00bbb791fc1250ae0e0f2b35a4c` | yes |
| `assets/icons/paep-icon-no-results.svg` | 8181 | `34a28fc84f615a96e6900240c33d33f31d249f4d6ab075be794a75e45bede041` | yes |
| `assets/icons/paep-icon-page-first.svg` | 8115 | `9dea8936e421bdf2d5e857d17ed74b2d2a75dc4b06dc953d8fa37fab7ede673c` | yes |
| `assets/icons/paep-icon-page-last.svg` | 8112 | `9b713b24844039ca65a73289820aecc94b92add82de6a920047fa328e420342d` | yes |
| `assets/icons/paep-icon-pending.svg` | 8132 | `777ce3db25faf83e52748411f94378c01a6700c427bf2e06ce2dc8051ff01fd9` | yes |
| `assets/icons/paep-icon-plus.svg` | 8098 | `48814ea7119eecd0467cb25a8018400e153e0727c10a75706bc513dbc47cede0` | yes |
| `assets/icons/paep-icon-retry.svg` | 8140 | `8c1263d7c7dfc9f7616e99cd983c5be914e58f4f720b2049901059b92b78f7b6` | yes |
| `assets/icons/paep-icon-search.svg` | 8139 | `76253286d2afe0924c6790e3edab48fa244d206d4b437481410cd8c49b7299e0` | yes |
| `assets/icons/paep-icon-spinner.svg` | 8107 | `947fa64447e328f260f9c26d063f9bab8faa5af1ca8dfb70e0929843df1c2324` | yes |
| `assets/icons/paep-icon-success.svg` | 8136 | `7eb59c11ae9e79b1c3043b79591048ded4737b96955e3b9ae615020b3a4c0cd4` | yes |
| `assets/icons/paep-icon-warning.svg` | 8197 | `7b7d557e6cd483cec4856945a3b08f8d65282a62819deb77624947893a80c59a` | yes |
| `assets/icons/paep-icons.sprite.svg` | 13265 | `ec7668a9c24dc44222e68effb46ee16d777d57281b37042a1337e1e5d1a7ac11` | yes |
| `component-map.md` | 4866 | `9b6b986057fb485b25a91798acbd9e242fb92471c8cb7111d02443b8a8a8665d` | no |
| `component-specs.md` | 57184 | `41130c4269affee7027a82780b2d441c79f1a3f8fa4b5967c7c0f351e7012f95` | yes |
| `content-keys.md` | 4597 | `f9d73cc4dc1e0f52770d5f5f77830105a15a1095d5e7bdba1ebe49379ba9bf21` | yes |
| `decision-record.md` | 12206 | `8c70c0c6ee1491b79c68b6e77af32026ffe112b0b0ab3e96974bf84e370263e3` | no |
| `design-brief.md` | 6360 | `6bda0ea807a7aa0eae44c8620e854c18975c4647278569eb089f7053b239b67d` | no |
| `design-review-report.md` | 6170 | `ad714e9e85145330ceaa809a2415c1a41a6e04d3cd5f30444f89b0f31824eef9` | yes |
| `deviations/README.md` | 224 | `e7bbb8aea3e3c3d1da539dcdaab787a2966b2af5eb08a6272543476560433792` | no |
| `foundation/prototype-reference.css` | 51044 | `e17a5536d4c1ee606f91c278b896e01bb696aafb5798eabb11d36812e846b32c` | yes |
| `foundation/token-values.candidate.json` | 7311 | `4c3dd26adf92b87e0e01f62b0b69b5d343e9251cd78913317af0441780eb9a1e` | yes |
| `foundation/token-values.md` | 25165 | `d03168ca35032ba290e2d35b8ac5bf0a66888e360a3c1a116fe7f9b91d23b629` | yes |
| `handoff.manifest.yaml` | 35982 | `24e7049dd675e2025ae75c099637fd3f0a9eb9f24ff2958d1ce88607d040ac53` | no |
| `interaction-notes.md` | 5641 | `99a55596ed0fd7a5d83c570289bf6339a71191cf6c0781f96e76a33e0ae6c494` | yes |
| `provenance.md` | 7625 | `e363e9e66a5b8c364423f234e42300f8fd55938eacc6ca45a26285e2c06d6997` | yes |
| `provenance/design-prompt.txt` | 21893 | `d565c7e88c58aa1e0cc8061a252cea9d3659a53f7f7e2b51982903e8b109c6ef` | yes |
| `provenance/generator/build.py` | 472 | `0f678a2f9da4a29cae997d822a3d692ec457ea7aacf3ec81d11be503f516eee5` | no |
| `provenance/generator/capture.js` | 3202 | `d2966b5fc44e707d9f334fc8dfac9a46a54b1dd892d95d9b7aac3ed36d6ee38c` | no |
| `provenance/generator/components.css` | 34795 | `f9233cbd0e999dbaa100413792b603d7a1181790b96eff43bedd2bfb464bbdcb` | no |
| `provenance/generator/contrast.py` | 301 | `029e7c8b2700e36fea930f3486e8537114f18dee1ef2016e71fc72737b913d91` | no |
| `provenance/generator/docs_gen.py` | 6575 | `02733a4be0405ae7a40d322364ddccad158b184a8627a7cecd999c23822a7d3f` | no |
| `provenance/generator/icons.py` | 4408 | `479248f3a9082f4c480c977e486680758eda481824329b35c8ade91080fbf632` | no |
| `provenance/generator/lab.css` | 7514 | `929f67859564a3fbf84a5bb2aae31d0938dda22befa9e8cb616b8c65d54456c7` | no |
| `provenance/generator/pages1.py` | 13165 | `06af260d7e61fad370a4613c38675c89908e9aa47d1938134d8f8128fd860e67` | no |
| `provenance/generator/pages2.py` | 10545 | `a1898e615fb0b5730348f10dc38730b81570c394e9a161decd8debb7a2d0ccc1` | no |
| `provenance/generator/pages3.py` | 16521 | `b8da0741540a65a6ee6b316c249a0b28595b6f865235440bcadb292c62b20f5f` | no |
| `provenance/generator/pages4.py` | 9908 | `ad97c0bca9a86a153f5b634636ba1d0a20b50dcd3ee27d37d9625a2855195c2e` | no |
| `provenance/generator/pages5.py` | 12109 | `7485e660a0ac08e33b4caaa85344d19896ca0696fdb862803a4998f0cf657631` | no |
| `provenance/generator/parts.py` | 11276 | `9392b0eee6447f0f7634fc100ea514a533889a056914d522bf7286fa74a06269` | no |
| `provenance/generator/shell.py` | 15191 | `bc6a77c6c06d3df69bf10eb938de163fe197137e0aec11f6a5ac729b7c4d44c8` | no |
| `provenance/generator/specs.py` | 50208 | `d4f7e4e0b6197a94cdcf80b407c301eb2269614b29bf360bbe437263cb47d44c` | no |
| `provenance/generator/tokens.py` | 10867 | `1bf41dc9e6ff133f2fba37b8f0433dd07c718c43dcb55745387a6243e92f679c` | no |
| `responsive-rules.md` | 4511 | `6b8d61cdb293d96f0e5d9ecd966b95bb6b968c985a123a2f2c7343814a0c29ac` | yes |
| `screens/C01-actions.html` | 84057 | `77ff8284433545eff06bd560d93e9e554560a952318f398ea261ce68e24be9fa` | yes |
| `screens/C02-forms.html` | 80172 | `f70317c7af5b2551f37f8bd2b3d0d9e1c29d6caba11ab43d7ffb5c8b5fd0cc2d` | yes |
| `screens/C03-table-shell.html` | 88397 | `aadeac2b01a7428ad2b070c0bae17d5dd2374252aa51c1a7a653da2ef6c90a3f` | yes |
| `screens/C03N-table-narrow-strategies.html` | 76113 | `1ab3359f8026a932eafe669b1637de32e144f9dcd9d58ec36c4ffee3a78d4fc9` | yes |
| `screens/C04-list-pagination-empty.html` | 77496 | `3885119295281de00913385868570c3b0b81dd329b2f4b6b52e65487bd134388` | yes |
| `screens/C05-feedback.html` | 76845 | `6de7c8e74a04c64d6fbe3869af075caaacd724e4691960842c03ac6d6edc06df` | yes |
| `screens/C06A-dialog-destructive.html` | 68225 | `e050400deb1f14986bdb887d9c1e35b30ef94bdf749b35560d17ddc02687c0ce` | yes |
| `screens/C06B-dialog-long-content.html` | 71802 | `d4028c8159d6aa58db8ac0e4fc68daa20eee3e81cd157fd4fedf05491f4ede07` | yes |
| `screens/C06C-dialog-form-large.html` | 69347 | `543adbb9415f75928e5b61971289b5f27c483f1cfdc0d624e49c78a3ff6f5ba2` | yes |
| `screens/C06D-drawer.html` | 69618 | `333ebb3d3c39ff8a5f315d410bda1074242fd7d83125ef7ac069ba13de202cb2` | yes |
| `screens/C06E-popover.html` | 68342 | `27867b4875e52a68213436f203b2b22fc9a5a802d246b56bb9cea20ee2f21377` | yes |
| `screens/C07-navigation.html` | 77957 | `a54a0b30dc00440f4e3e0eb518e75c64575db08a4662a3246f4c65bd5115ec6b` | yes |
| `screens/C08-structure.html` | 72989 | `129b0df102d090672313b1fef57fd1a1f08541f8e3c3ee453df699798997628e` | yes |
| `screens/F01-colour.html` | 91924 | `04f5116cccfbcb9fc5bd5445d8926f19299ed8c8bfd379046e4373c09319d328` | yes |
| `screens/F02-typography.html` | 71353 | `71f13212d9b945601058f3e03bf7a64728958ee638cf70064804dd7670d7b203` | yes |
| `screens/F03-spacing-size-radius.html` | 71793 | `bd68fc3ebac35b80de0ed492fdeeb9e85e84542435a04dbf021332978ea23c1f` | yes |
| `screens/F04-surfaces-elevation.html` | 68690 | `3a4ce24e3ce12b46b3386b9a2d8250ed8fec58f3817b07ec361a4539e6826107` | yes |
| `screens/F05-motion.html` | 71112 | `2e8846e669ecf6488f273d66f3223affd7442571c5245d61417e3aa6fa988cfe` | yes |
| `screens/F06-density.html` | 75690 | `ce173e543dc0998a9792f72b3afe7c1490842b5227472c6ca9d9b9ab088d93fa` | yes |
| `screens/F07-focus-states.html` | 73434 | `8c900114a8d4ffd1d150884ace33c4a18e670c9c58ff344819d67a89ad1cdfd0` | yes |
| `screens/F08-icons.html` | 78304 | `5620a686c867fe0abb9b782b25eaa826a599f6766c677ed3f680da3d19b15c5b` | yes |
| `screens/F09-brand-override.html` | 76817 | `5e5462d1bea14ce86baf900eab9d6dbc635f87bd0d4edb7bb74cfd7eea0af201` | yes |
| `screens/L01-ui-lab-home.html` | 69726 | `b3f87bbe1a460d1b2d9424d69c738e8152bbe91eeffc160c701c718c881db72a` | yes |
| `screens/L02-ui-lab-specimen-button.html` | 68882 | `92c7721242a031951bb6a426d11914785acf5182b0fcbbbfbb3869623c4bae50` | yes |
| `screens/R01-long-content.html` | 79406 | `ba21e4c3717bc8396cd2ff91368c0827bd50fe5298e2c85b21674f2751c26f65` | yes |
| `screens/R02-rtl.html` | 78809 | `aab96ea4c15407732c8f9fe417176471aad62e19ef1072df794ddadfb97448f5` | yes |
| `screens/R02D-drawer-rtl.html` | 66543 | `67701455d3f9edefac58c41b8b78792da4964050144839eca6af679b6cecb975` | yes |
| `screens/R03-reflow-320.html` | 81912 | `898b2ad3a6b79c892a7474d446567acddc1c1bd6167fb5fd912dc9681f418466` | yes |
| `screens/render-check.json` | 25220 | `e91eb6442d6029b46eccf5ddb55e348d2f2eb936d113a1afa3148d73dea1ffce` | yes |
| `screens/renders/C01-actions--desktop.png` | 524544 | `df81b94094892ce3b2ab7990583141d9b35ef9a92d7137de57bd875d04fbb908` | yes |
| `screens/renders/C01-actions--narrow320.png` | 448692 | `6146e681932e5d0f331325b9957e592e6997cbdf2d0c6b165bdedb7457170695` | yes |
| `screens/renders/C01-actions--tablet.png` | 490483 | `33e45507eae2209790ccb39ce91e958ef9427a3912416b2bd843ebd0ea0f015e` | yes |
| `screens/renders/C02-forms--desktop.png` | 622316 | `8569da4971df0b7a54dfc8f4066afac8a21b689c2aed0936b39ee4cb20ceabcc` | yes |
| `screens/renders/C02-forms--narrow320.png` | 598717 | `fc43045481cc448d73ce0d8e37c374e3273591df9a4a77cf95fe2733ce656316` | yes |
| `screens/renders/C02-forms--tablet.png` | 587192 | `99fa2187dec7f15d047ac489f6afcf9fcc8e036bbdc821b263ee6950da218213` | yes |
| `screens/renders/C03-table-shell--desktop.png` | 435862 | `7cc03ffd6993587132f7ec99571c015aeda3279b9df4069c329934a38e4e2633` | yes |
| `screens/renders/C03-table-shell--narrow320.png` | 365060 | `c2cbefe8c4e69e61d3eb267df8a5743a07b6b839de6687f191250769c50b6c52` | yes |
| `screens/renders/C03-table-shell--tablet.png` | 382087 | `1f655bb69b6b8c4f7e3d8635d8de938c5647f947934d816b2b221ca996da787c` | yes |
| `screens/renders/C03N-table-narrow-strategies--desktop.png` | 318120 | `d3b8052ccd9709d1240d4c9a84d02cdb27a868ae688d7a78924c89cb30872bc0` | yes |
| `screens/renders/C03N-table-narrow-strategies--narrow320.png` | 214590 | `11ba17960ae29b23060bfc359af02b70d939d5c92062b29044ed3bf7f087af5b` | yes |
| `screens/renders/C03N-table-narrow-strategies--tablet.png` | 285957 | `40677e835360cb82b53a649f3cda89783a72e747ac61d48a0e018cfdb71aa3c6` | yes |
| `screens/renders/C04-list-pagination-empty--desktop.png` | 373813 | `8b9d6a0589dbc86a49c279d7aad98922d20ac20b053977c4d215365f217c4f06` | yes |
| `screens/renders/C04-list-pagination-empty--narrow320.png` | 330761 | `ba84574cb183bacd3a04e05ba35b7e030dc6e10ddfbd8078f5b2f50eea967c87` | yes |
| `screens/renders/C04-list-pagination-empty--tablet.png` | 343332 | `51b96ac4911fe736d155e0fa668bb0d83351f18f42e3ad51a35a1c0de674ed26` | yes |
| `screens/renders/C05-feedback--desktop-reduced-motion.png` | 462253 | `933a5b76ff498549fac469e3fcd06214776d04c7fb55bc6149e02ff9719d6aa6` | yes |
| `screens/renders/C05-feedback--desktop.png` | 462189 | `0bf5f073c1b7de78aea5ceb1e24bcde27cdc2b4bc442c07ad9b253379c800d8a` | yes |
| `screens/renders/C05-feedback--narrow320.png` | 415437 | `a6034e1b4b04bc4ad6c6c2e58a58cbff196660698bb904cade83ca3ec2adddeb` | yes |
| `screens/renders/C05-feedback--tablet.png` | 432322 | `977a3b1a16ce9d47a97a89204dac84f2effd98abf2fc384640b91b348e2d2317` | yes |
| `screens/renders/C06A-dialog-destructive--desktop.png` | 193617 | `1bd7f0bf01977e42cdef9e08b070c3ba4c0cda2d3bae5ec0aab425c9c455638c` | yes |
| `screens/renders/C06A-dialog-destructive--narrow320.png` | 59674 | `4b59d9fea37cbf950a671a9997dc4a774133546e8759baf5ca7bba783879bc6a` | yes |
| `screens/renders/C06A-dialog-destructive--tablet.png` | 155328 | `0a89a6e1c3607ae7a1109e06680086cc5fab80435c3bd772967cb92588dfc32c` | yes |
| `screens/renders/C06B-dialog-long-content--desktop.png` | 248787 | `974e8f934860b0479ede2481a56306e2888df8c3e31a4a8e6feba5d7bfb19b6f` | yes |
| `screens/renders/C06B-dialog-long-content--narrow320.png` | 57983 | `4f2df8a688461f741115917763e146492c1674ebc84f34f58fe614573c0628de` | yes |
| `screens/renders/C06B-dialog-long-content--tablet.png` | 218048 | `ac400fe99c85ebc8d7d39e9a00e51e9e78b131357e5a4cbf6e1c01b46bd43d16` | yes |
| `screens/renders/C06C-dialog-form-large--desktop.png` | 151285 | `3795b771c8b5e1831a3fa396b622f61693930475bba35c602aed5744192bacf4` | yes |
| `screens/renders/C06C-dialog-form-large--narrow320.png` | 27535 | `73a839f63c42b383e025cfe0bd0d2d8585fb6461b50b792838f7e557bc02554e` | yes |
| `screens/renders/C06C-dialog-form-large--tablet.png` | 103818 | `e0e771cf01bd5b9a1811298785aad03a8d053f0811c149db2c6da485505e9563` | yes |
| `screens/renders/C06D-drawer--desktop.png` | 172674 | `f83f0101857343c4ebfe9fe7fa13896ccde46d48945e33674a85fa8ee1cc8676` | yes |
| `screens/renders/C06D-drawer--narrow320.png` | 34513 | `e6a744851953211ab0716955567242d00feb0b446cf06d47cb6884d20846f740` | yes |
| `screens/renders/C06D-drawer--tablet.png` | 124781 | `f25e69f4f4470a08b76bedb6df3d0540ed72b61c5b68ced4a67db74855115117` | yes |
| `screens/renders/C06E-popover--desktop.png` | 171483 | `7e91da0cc9750d3e97a15a0bb10a9e704a845dbbad99bcb16636e04cc5b29689` | yes |
| `screens/renders/C06E-popover--narrow320.png` | 50522 | `3545200959d9c578060f110a03a1dcffe8dda4a7b1bf4ef4eba7943906ba1260` | yes |
| `screens/renders/C06E-popover--tablet.png` | 145313 | `64c64f12c57e85cf2160b11d23f3da75afaacc2f23b111b7c187b240f81f855a` | yes |
| `screens/renders/C07-navigation--desktop.png` | 338717 | `06a1251a20afb03e7402df7fef9f8fdde4008b64b54d0b4024faa066a6f95c92` | yes |
| `screens/renders/C07-navigation--narrow320.png` | 289009 | `3456d72e33357d027134315cb8475eaec8e2bd59a48ba5e4e829474ddbc18d56` | yes |
| `screens/renders/C07-navigation--tablet.png` | 302909 | `493690cb18b04ce0df7f46ea03a87d182983bccd2dfc019f2ab8a2905ca217f2` | yes |
| `screens/renders/C08-structure--desktop.png` | 340811 | `6e4f907106668f5f19ba38033807ba5d51b40ae27e73b2b12c3392fdfa88c8a7` | yes |
| `screens/renders/C08-structure--narrow320.png` | 302292 | `71e6019771d4193e85f2bf1e0785c8c52afbbde5f48be3cd0439796b4500f290` | yes |
| `screens/renders/C08-structure--tablet.png` | 310557 | `c9217122fca888e403047f67adefbcd6d95432a5fa3650dc0f3b59f3dd13c31a` | yes |
| `screens/renders/F01-colour--desktop.png` | 649245 | `951bea4856c410d81879b96bed16ae7233964202e8a49a20f1256476884ae50a` | yes |
| `screens/renders/F01-colour--narrow320.png` | 627206 | `826b95b45e826a4617f18c7c04bf43c987ac4cbc2376adef84d6d435ed3ec699` | yes |
| `screens/renders/F01-colour--tablet.png` | 616908 | `41ad428676babb8b4991c2292f634f797a5e005f24745c6b48c9bc3d1d4d5b4d` | yes |
| `screens/renders/F02-typography--desktop.png` | 290326 | `28204d23035107ec8dd15fd0397e43e9539bed90abf2d9a680a8024a56e4ff8a` | yes |
| `screens/renders/F02-typography--narrow320.png` | 240052 | `8ed36bc1effc67868d87c91ca15386e2f96f4cdf3efc956249c9a198229c2ee5` | yes |
| `screens/renders/F02-typography--tablet.png` | 254130 | `768049416177f8c5de1e782f3682895dbf37cebdd2ebff85064d72196dd708b8` | yes |
| `screens/renders/F03-spacing-size-radius--desktop.png` | 249948 | `f74a656850279e7648e4c6e133c4e8bca02cf2f18cf7841d3ea7d427b8cd3fff` | yes |
| `screens/renders/F03-spacing-size-radius--narrow320.png` | 214586 | `c433d601c8b73c6c32d787053a5773a68cd0ef2a95d44c9724de9316aa483ec7` | yes |
| `screens/renders/F03-spacing-size-radius--tablet.png` | 207078 | `6364db5dc888cd1211b7c2c1a408e9bd828faf1de6c3b2b720fad46872613723` | yes |
| `screens/renders/F04-surfaces-elevation--desktop.png` | 176805 | `5ec645538b42327e8dd8bd1d277d887e1a45df7563843a38d314e55de8b81a9f` | yes |
| `screens/renders/F04-surfaces-elevation--narrow320.png` | 142974 | `e46bdea67903625f52d2b7343030bb25bc759dd25027d681e0d4bb3a4c99b7cd` | yes |
| `screens/renders/F04-surfaces-elevation--tablet.png` | 137739 | `771114f4c3c908c6d69af66ed6f72f83b379a5f1bae86d7f23a4ef73134211dc` | yes |
| `screens/renders/F05-motion--desktop-reduced-motion.png` | 238226 | `ed89f7230a93a14f2260fbebea3931b857d43b8bc3aa86815ef89deac577532c` | yes |
| `screens/renders/F05-motion--desktop.png` | 239056 | `2724c4e8fd2113919be2c5511a128e0375b406c48b3d9417dc6c3e95bc016266` | yes |
| `screens/renders/F05-motion--narrow320.png` | 216217 | `b38bb48e1ff268cbe18d6108fd52323cea554f4cbf2d69371387b09bcf8e1040` | yes |
| `screens/renders/F05-motion--tablet.png` | 207667 | `408e77bd00efe6252a2f5c2f72c96722918eebff6c97f0eadcbf1b8cf2872750` | yes |
| `screens/renders/F06-density--desktop.png` | 211069 | `98f8dd262cac10c6bc18deb01f73192dd6c41e8f32e954f7ca189bb526ed51b2` | yes |
| `screens/renders/F06-density--narrow320.png` | 172742 | `45267058dc670a96fc714bca07b78e254866badb0c6a1e53ca310baf4f66ee6a` | yes |
| `screens/renders/F06-density--tablet.png` | 169618 | `b1246f08443b0315d2a0b11ec613affc5673105ba20a20f013376fee5f76eb77` | yes |
| `screens/renders/F07-focus-states--desktop.png` | 223976 | `9c6482449be495ce4569497019ee5d2ddb5732954be524e555450e5fad055bd9` | yes |
| `screens/renders/F07-focus-states--narrow320.png` | 139385 | `a0b8f847b8b8d52f269a73c8e625dc0b7e93835da009b24e92bd5d03fdf997d3` | yes |
| `screens/renders/F07-focus-states--tablet.png` | 187127 | `6b3560f248a1c4858a68276bc173ea1f9611d8578006baf4d2a19cba74507777` | yes |
| `screens/renders/F08-icons--desktop.png` | 271713 | `320ebeb9e9eb5f8ff8a7cc0fa4464703307351d2246badb1fcb9dd4b5048a243` | yes |
| `screens/renders/F08-icons--narrow320.png` | 174587 | `f6b8c9950514c686700da30b68bc62282dcd648bf54b5e976e6cacd52c301f53` | yes |
| `screens/renders/F08-icons--tablet.png` | 232404 | `b59adef5b9982af274dd35cc29fc00f142b2d0e0cf39585cfbc553ea3ab97fdc` | yes |
| `screens/renders/F09-brand-override--desktop.png` | 271385 | `f26b7bdf5fbce34cfbea8c26d098e0d056e64b5e41fc862037c980c2e5aa3174` | yes |
| `screens/renders/F09-brand-override--narrow320.png` | 255361 | `6d70c5d9a942de494ab6af07da9399a6c03f027857038a4ee1528e65e42ea19f` | yes |
| `screens/renders/F09-brand-override--tablet.png` | 258390 | `8290a17a271cb6cb69be20cc1bdb4c8d06cb1e2b9a6968337b5a1521751f63a0` | yes |
| `screens/renders/L01-ui-lab-home--desktop.png` | 227385 | `f7b809a39ebe17e877c4b1cb9404a19a09321285dcf4d9510ae4543945e7593b` | yes |
| `screens/renders/L01-ui-lab-home--narrow320.png` | 193728 | `d3d457d84924023d45a076d53205789d596a4a18d2c155a2d65968d268b080d5` | yes |
| `screens/renders/L01-ui-lab-home--tablet.png` | 195619 | `f2119f3af0706c1f53548066abf6a0c2618d0c94fd789b988366c1243a20c24f` | yes |
| `screens/renders/L02-ui-lab-specimen-button--desktop.png` | 236295 | `37e2ef2db42e4639432e1b86a91fe4138de2adcd093fadfd9775e873f31661de` | yes |
| `screens/renders/L02-ui-lab-specimen-button--narrow320.png` | 200062 | `b1079b36b455b03909ed0f6960e75b308d4b65385bab07cc203f9caa2dfde1e5` | yes |
| `screens/renders/L02-ui-lab-specimen-button--tablet.png` | 202448 | `64935edc1ea58c4d051935f87715e82bca64522e7a73b67c198d2e396d0612d3` | yes |
| `screens/renders/R01-long-content--desktop.png` | 365687 | `0eb3be4143e1314ddbc7a8e03794993307665e34e73fad46596ce1229d5c29a2` | yes |
| `screens/renders/R01-long-content--narrow320.png` | 316670 | `edfa806a8f1a8048edf20990e2ca635fa005cd82120c1f5388c37f1930b6ffcb` | yes |
| `screens/renders/R01-long-content--tablet.png` | 324004 | `0d7ff42707025d3c78f94b4631e167b98edbacf3a574247f7317a749b62fb4a8` | yes |
| `screens/renders/R02-rtl--desktop.png` | 219791 | `5e0f5a7a236cf41756beb01b5b79b5d1dd32c9dbf6bcd27bc25d2c570941eb13` | yes |
| `screens/renders/R02-rtl--narrow320.png` | 159821 | `53b2de6084ced79ef33cdff00b21f13c14d9eb52c79bef8d3ddffeb8b7f0afe7` | yes |
| `screens/renders/R02-rtl--tablet.png` | 175656 | `824fe0a9dd1d9241f47795ce5c5fc87267f117f2a1432346fc422829753d256d` | yes |
| `screens/renders/R02D-drawer-rtl--desktop.png` | 91457 | `5e58f354e0836d3771907fec316529580940f70941aa1abc3a1c757f0ebde936` | yes |
| `screens/renders/R02D-drawer-rtl--narrow320.png` | 19785 | `cf2644f2b01a2b2a056d02f4309d4fcb7860aa0e1e8131bd842c80b4da824a75` | yes |
| `screens/renders/R02D-drawer-rtl--tablet.png` | 53840 | `663c6b453ba645d29949aebfab0fd4e5b0d96419dc12d66a4cd65e0b88d80fd8` | yes |
| `screens/renders/R03-reflow-320--desktop.png` | 281155 | `1340ac194f306ecc3d62cae754de0c17ad67d3c4b23bedaa2906ec56fe745879` | yes |
| `screens/renders/R03-reflow-320--narrow320.png` | 203460 | `2b2ea5e6a8a553efe00e5a0235a1ccc94fcbf02df10698ab5a2cfaaa9e44c7e6` | yes |
| `screens/renders/R03-reflow-320--tablet.png` | 231911 | `2542af7c8d630dc4c15ca49d7a83a1a7c3b9cbc13141d464774c229153458f41` | yes |
