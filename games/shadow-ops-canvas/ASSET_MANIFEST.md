# Asset Manifest

## Active Runtime Assets

| Key | Path | Use |
| --- | --- | --- |
| `environmentPack` | `assets/environment3d/cyber-vault-v1/environment-pack-manifest.json` | Optional manifest-driven cyber-vault startup/title background pack, enabled with `?envpack=cyber-vault-v1`; gameplay level backgrounds remain unchanged |
| `hero` | `assets/hero/lottomind-hero-main.png` | Title image and HUD portrait source |
| `player` | `assets/mascot/lottomind-mascot-runner-atlas.png` | Active original runtime player animation atlas |
| `level1Bg` | `assets/backgrounds/higgsfield_photo_neon_jungle_bg_20260624.jpeg` | Active Higgsfield concept-matched Level 1 Neon Jungle Vault background |
| `level2Bg` | `assets/levels/level2_bg_far.webp` | Level 2 Golden Circuit Foundry background |
| `level3Bg` | `assets/levels/level3_bg_far.webp` | Level 3 Astral Vault Core background |
| `level1Tiles` | `assets/levels/platform_tiles_level1_clean.png` | Active cleaned Level 1 modular platform source |
| `level2Tiles` | `assets/levels/platform_tiles_level2_clean.png` | Active cleaned Level 2 modular platform source |
| `level3Tiles` | `assets/levels/platform_tiles_level3_clean.png` | Active cleaned Level 3 modular platform source |
| `bossCanopy` | `assets/bosses/canopy_drone_queen_cutout.png` | Level 1 boss sprite |
| `bossCanopyMotion` | `assets/bosses/canopy_drone_queen_motion_sheet_runtime_384.png` | Repacked 6-frame Level 1 boss motion sheet, resized under browser texture limits |
| `bossForge` | `assets/bosses/jackpot_forge_titan_cutout.png` | Level 2 boss sprite |
| `bossForgeMotion` | `assets/bosses/jackpot_forge_titan_motion_sheet_runtime_384.png` | Repacked 6-frame Level 2 boss motion sheet, resized under browser texture limits |
| `bossMidas` | `assets/bosses/midas_heartcore_overlord_cutout.png` | Final boss sprite |
| `bossMidasMotion` | `assets/bosses/midas_heartcore_overlord_motion_sheet_runtime_384.png` | Repacked 6-frame final boss motion sheet, resized under browser texture limits |
| `levelFrame` | `assets/ui/level_card_frame.png` | Canvas level intro and complete card frame |
| `victoryBadge` | `assets/ui/final_victory_badge.png` | Final victory card badge source |
| `enemyCrawler` | `assets/characters/enemy_crawler.png` | Standard ground crawler sprite |
| `crawlerWalk` | `assets/characters/higgsfield_robot_dog_walk_strip_runtime_v2.png` | Active 8-frame robot dog walk/trot strip, rendered smaller in game so it matches the hero and platform scale |
| `enemyDrone` | `assets/characters/enemy_drone.png` | Standard hover drone sprite |
| `enemyShieldGuard` | `assets/characters/enemy_shield_guard.png` | Standard shield guard sprite |
| `enemyTurret` | `assets/characters/enemy_turret.png` | Standard wall/floor turret sprite |
| `cannonTurretMotion` | `assets/characters/higgsfield_cannon_turret_motion_strip_runtime_v3.png` | Cleaned 8-frame cannon strip, rendered smaller in game so it fits the platform and hero scale |
| `droneMotion` | `assets/characters/higgsfield_drone_motion_strip_runtime_v3.png` | Cleaned 8-frame drone strip for idle, hover, charge, fire, recoil, recover, and hit states |
| `droneLaserOverlay` | `assets/characters/chatgpt_drone_laser_overlay_strip_runtime_v2.png` | Cleaned no-crop laser overlay strip drawn from the drone muzzle and stretched toward targets |
| `droneFx` | `assets/mission/chatgpt_drone_fx_strip_runtime_v4.png` | Rebuilt 8-frame drone charge, muzzle, beam, impact, burst, and particle FX strip with frame 2 fixed |
| `shieldRobotMotion` | `assets/characters/chatgpt_shield_robot_mission_strip_runtime_v5.png` | Cleaned 8-frame attacking shield robot strip with green screen removed to transparency |
| `enemyMotion` | `assets/characters/higgsfield_enemy_motion_sheet_runtime.png` | Active padded enemy animation overlay sheet for drones, crawlers, shield guards, and turrets |
| `missionCollectibles` | `assets/mission/mission_collectibles_sheet.png` | Animated shards, keycards, health hearts, and overdrive pickups |
| `missionPortal` | `assets/mission/extraction_portal_sheet.png` | Animated extraction portal ring |
| `missionGate` | `assets/mission/vault_gate_sheet.png` | Animated branded vault gate column |
| `cyberGateSheet` | `assets/mission/chatgpt_cyber_vault_gate_sheet_v1.png` | Active transparent cyber-vault gate sheet for closed, open, damaged, and decorative gate states |
| `missionBrandProps` | `assets/mission/branded_background_props_sheet.png` | Branded background medallions, terminals, relays, and plaques |
| `missionProps` | `assets/mission/higgsfield_missing_world_props_runtime_v3.png` | Ghost-cleaned Higgsfield background prop cutouts layered into the level scenery |
| `fxSheet` | `assets/mission/higgsfield_separate_fx_repair_runtime_v4.png` | Active repaired FX sheet with frames 2, 3, 4, 5, 6, 17, 18, and 19 cleaned again for transparent cells |
| `gameplayFx` | `assets/mission/chatgpt_gameplay_fx_sheet_runtime_v2.png` | Active gameplay FX sheet for weapon pickups, arena locks, enemy tells, boss weak points, terminal rewards, and status cues |
| `gameMusic` | `assets/audio/digital-static-10.mp3` | Active looping gameplay music track, played only during run gameplay and controlled by the Music setting |
| `titleTrailer` | `assets/video/lottomind-number-run-startup-higgsfield-20260624.mp4` | Active muted Higgsfield startup trailer, generated from the original hero and cyber-jungle background references |
| `missionBatchProps` | `assets/mission/higgsfield_batch_props_runtime_v3.png` | Ghost-cleaned 5x4 Higgsfield reference batch for ruby vial, terminals, mossy cyber platforms, pipes, relays, vault plates, and portal props |
| `missionBatchWorld` | `assets/mission/higgsfield_photo_world_retry_runtime_v3.png` | Ghost-cleaned Higgsfield reference batch for platform pieces, wall panels, vines, ladders, terminals, pipes, mushrooms, ruby vial, and world-fill objects |
| `missionBatchFx` | `assets/mission/higgsfield_batch_fx_retry_runtime_v3.png` | Ghost-cleaned 5x4 Higgsfield reference retry batch for hearts, ruby pickups, keys, shield/overdrive icons, sparks, and short beams |

## Optional Environment Pack: `cyber-vault-v1`

Enable on the startup/title screen with `?envpack=cyber-vault-v1`. Gameplay level backgrounds remain the normal level art. Remove that query parameter to roll back instantly.

| Path | Use |
| --- | --- |
| `assets/environment3d/cyber-vault-v1/layers/far-purple-nebula-sky.png` | Far purple nebula sky parallax layer |
| `assets/environment3d/cyber-vault-v1/layers/distant-cyber-vault-silhouettes.png` | Distant cyber-vault tower silhouette parallax layer |
| `assets/environment3d/cyber-vault-v1/layers/mid-circuit-wall.png` | Mid-background black-gold circuit wall layer |
| `assets/environment3d/cyber-vault-v1/layers/hologram-fog-overlay.png` | Subtle hologram and fog overlay layer |
| `assets/environment3d/cyber-vault-v1/platforms/platform-modules-sheet.png` | Modular side-scrolling platform sheet |
| `assets/environment3d/cyber-vault-v1/props/interactive-cyber-vault-props-sheet.png` | Interactive cyber-vault prop sheet |
| `assets/environment3d/cyber-vault-v1/overlays/foreground-overlay-sheet.png` | Foreground/fog/glow/particle overlay sheet |
| `assets/environment3d/cyber-vault-v1/props/heart-core-reactor-states-sheet.png` | Heart-core reactor variants for boss arena backgrounds |
| `assets/environment3d/cyber-vault-v1/preview/shadow-ops-environment-pack-preview.png` | Generated 4K preview contact sheet |

## Generated Supporting Assets

### Complete Boss Motion Pass

| Path | Status |
| --- | --- |
| `assets/bosses/canopy_drone_queen_motion_v2_source.png` | ChatGPT Image source for the eight-pose Canopy Drone Queen strip. |
| `assets/bosses/canopy_drone_queen_motion_v2_runtime_384.png` | Active normalized eight-frame hover, charge, fire, hit, and defeat strip. |
| `assets/bosses/jackpot_forge_titan_motion_v2_source.png` | ChatGPT Image source for the eight-pose Jackpot Forge Titan strip. |
| `assets/bosses/jackpot_forge_titan_motion_v2_runtime_384.png` | Active normalized eight-frame idle, step, slam, hit, and defeat strip. |
| `assets/bosses/midas_heartcore_overlord_motion_v2_source.png` | ChatGPT Image source for the eight-pose Midas Heartcore Overlord strip. |
| `assets/bosses/midas_heartcore_overlord_motion_v2_runtime_384.png` | Active normalized eight-frame core, shield, fire, damage, and overload strip. |
| `tools/repack_generated_boss_strip.py` | Reusable silhouette-aware fixed-cell repacker with shared scale and bottom-center anchors. |

| Path | Status |
| --- | --- |
| `assets/levels/platform_tiles_level1.png` | Higgsfield source art; retained as original download. |
| `assets/levels/platform_tiles_level2.png` | Higgsfield source art; retained as original download. |
| `assets/levels/platform_tiles_level3.png` | Higgsfield source art; retained as original download. |
| `assets/levels/platform_tiles_level1_clean.png` | Active runtime copy with preview background removed to alpha. |
| `assets/levels/platform_tiles_level2_clean.png` | Active runtime copy with preview background removed to alpha. |
| `assets/levels/platform_tiles_level3_clean.png` | Active runtime copy with preview background removed to alpha. |
| `assets/ui/boss_health_frame.png` | Generated and cleaned; retained for future DOM/CSS HUD integration. Current boss HUD is DOM/CSS for legibility. |
| `assets/hero/lottomind-hero-main-313.png` | Archived non-runtime shirt-mark variant of the approved title hero. |
| `assets/mission/mission_collectibles_sheet.png` | Local optimized sprite sheet; active runtime pickup animation. |
| `assets/mission/extraction_portal_sheet.png` | Local optimized sprite sheet; active runtime extraction animation. |
| `assets/mission/vault_gate_sheet.png` | Local optimized sprite sheet; active runtime vault gate animation. |
| `assets/mission/chatgpt_cyber_vault_gate_sheet_v1.png` | Active transparent six-cell cyber-vault gate replacement sheet generated locally after ChatGPT Image and Higgsfield tooling were unavailable/unusable in-session. |
| `assets/mission/branded_background_props_sheet.png` | Local optimized sprite sheet; active runtime branded background props. |
| `assets/characters/higgsfield_enemy_motion_sheet.webp` | Higgsfield source download for enemy motion; cleaned into active transparent PNG. |
| `assets/characters/higgsfield_enemy_motion_sheet_alpha.png` | Transparent 3x4 enemy motion source sheet. |
| `assets/characters/higgsfield_enemy_motion_sheet_runtime.png` | Active runtime enemy sheet with per-cell padding to prevent edge clipping. |
| `assets/characters/higgsfield_drone_motion_strip_runtime.png` | Active runtime drone-specific 8-frame motion strip derived from the approved Higgsfield enemy sheet with added in-between charge/fire/recoil frames. |
| `assets/characters/higgsfield_drone_laser_overlay_strip_runtime.png` | Archived earlier drone laser overlay strip; retained as fallback/source reference. |
| `assets/characters/chatgpt_drone_laser_overlay_strip_runtime.png` | Active runtime drone laser overlay strip with fully contained beam frames and no cropped third-frame beam. |
| `assets/characters/chatgpt_drone_laser_overlay_strip_preview.png` | Checkerboard QA preview for the active drone laser overlay strip. |
| `assets/mission/chatgpt_drone_fx_strip_source.png` | Archived ChatGPT Image source strip on chroma key for drone charge, muzzle, beam, impact, burst, and particle FX. |
| `assets/mission/chatgpt_drone_fx_strip_alpha.png` | Transparent source-sized drone FX strip with green background removed. |
| `assets/mission/chatgpt_drone_fx_strip_clean_source.png` | Rebuilt clean no-cut 8-frame drone FX strip source with centered charge, muzzle, beam, impact, burst, and particle cells. |
| `assets/mission/chatgpt_drone_fx_strip_runtime.png` | Active normalized 8-frame drone FX strip used around drone charge and laser attacks; rebuilt with no cropped cells. |
| `assets/mission/chatgpt_drone_fx_strip_preview.png` | Checkerboard QA preview for the active drone FX strip. |
| `assets/characters/chatgpt_robot_dog_walk_strip_source.png` | ChatGPT Image green-screen source strip for the upgraded attacking robot dog walk cycle. |
| `assets/characters/chatgpt_robot_dog_walk_strip_alpha.png` | Transparent source-sized robot dog walk strip with green background keyed out. |
| `assets/characters/chatgpt_robot_dog_walk_strip_runtime.png` | Archived normalized 8-frame robot dog walk/trot strip retained as fallback. |
| `assets/characters/chatgpt_robot_dog_walk_strip_preview.png` | Checkerboard QA preview for the archived ChatGPT robot dog walk strip. |
| `assets/characters/higgsfield_robot_dog_walk_strip_runtime_v2.png` | Active normalized 8-frame robot dog walk/trot strip, tuned down in code for smaller visual and collision scale. |
| `assets/characters/chatgpt_shield_robot_motion_strip_source.png` | ChatGPT Image green-screen source strip generated from the user-provided shield robot reference. |
| `assets/characters/chatgpt_shield_robot_motion_strip_alpha.png` | Transparent source-sized strip with the green background keyed out. |
| `assets/characters/chatgpt_shield_robot_motion_strip_runtime.png` | Active runtime shield robot strip, normalized with safe padding and no visible green pixels. |
| `assets/characters/chatgpt_cannon_turret_motion_strip_source.png` | ChatGPT Image source strip on chroma key for the upgraded cannon/turret animation. |
| `assets/characters/chatgpt_cannon_turret_motion_strip_alpha.png` | Transparent 8-frame cannon/turret motion source strip. |
| `assets/characters/chatgpt_cannon_turret_motion_strip_runtime.png` | Archived rebuilt runtime cannon/turret strip with true 8-cell layout, contained frame 5 muzzle flash, and padded frame 8 debris. |
| `assets/characters/chatgpt_cannon_turret_motion_strip_preview.png` | Checkerboard QA preview for the archived ChatGPT cannon/turret strip. |
| `assets/characters/chatgpt_cannon_turret_motion_strip_runtime_legacy_2172x724.png` | Archived earlier raw cannon/turret runtime strip retained for rollback. |
| `assets/characters/higgsfield_cannon_turret_motion_strip_runtime_v2.png` | Active Higgsfield cannon/turret strip, tuned down in code for smaller visual and collision scale. |
| `assets/mission/higgsfield_mission_fx_collectibles_sheet.webp` | Higgsfield source download for mission FX and pickups; cleaned into active transparent PNG. |
| `assets/mission/higgsfield_mission_fx_collectibles_sheet_alpha.png` | Transparent mission FX and pickup source sheet. |
| `assets/mission/higgsfield_mission_fx_collectibles_sheet_runtime.png` | Active runtime mission FX sheet with per-cell padding to prevent cropped glows. |
| `assets/mission/higgsfield_background_props_sheet.webp` | Higgsfield source download for branded background props; cleaned into active transparent PNG. |
| `assets/mission/higgsfield_background_props_sheet_alpha.png` | Transparent 4x4 background/platform prop source sheet. |
| `assets/mission/higgsfield_background_props_sheet_runtime.png` | Active runtime background/platform prop sheet with border noise removed and per-cell padding. |
| `assets/mission/chatgpt_gameplay_fx_sheet_source.png` | ChatGPT Image source sprite sheet on chroma key for missing gameplay assets. |
| `assets/mission/chatgpt_gameplay_fx_sheet_alpha.png` | Transparent 5x4 gameplay FX and warning source sheet. |
| `assets/mission/chatgpt_gameplay_fx_sheet_runtime.png` | Active runtime gameplay FX and warning sheet with per-cell padding. |
| `assets/mission/higgsfield_missing_assets_source_20260623.jpeg` | Higgsfield Nano Banana 2 source sheet generated from the user-provided reference image for missing world props and FX. |
| `assets/mission/higgsfield_missing_assets_alpha_20260623.png` | Local cleaned cutout version of the new Higgsfield source sheet. |
| `assets/mission/higgsfield_missing_world_props_runtime_v1.png` | Active runtime 4x4 world prop sheet with extra wall panels, mossy platforms, vault doors, pickups, shields, shards, and sparks. |
| `assets/mission/higgsfield_missing_fx_sheet_runtime_v1.png` | Active runtime 5x4 FX sheet with repaired cells 2, 3, 4, 5, 6, 12, 16, 18, and 20 to avoid clipping and baked checker artifacts. |
| `assets/mission/higgsfield_fx_repair_source_20260624.jpeg` | Higgsfield green-background 5x4 FX repair source generated from the later mascot/reference image. |
| `assets/mission/higgsfield_fx_repair_alpha_20260624.png` | Chroma-keyed transparent source-sized FX repair sheet. |
| `assets/mission/higgsfield_fx_repair_runtime_v1.png` | Active runtime 5x4 FX sheet with row-one heart frames 2, 3, 4, and 5 rebuilt inside fixed cells, plus final green-spill cleanup for cleaner transparency. |
| `assets/mission/higgsfield_reference_assets_source_20260624.png` | Higgsfield 5x4 reference-generated mission asset source with ruby vial, keys, heart shots, sparks, terminals, crates, cannon, pipes, and vault props. |
| `assets/mission/higgsfield_reference_assets_alpha_20260624.png` | Chroma-keyed transparent source-sized mission asset sheet from the 2026-06-24 reference generation. |
| `assets/mission/higgsfield_reference_assets_runtime_v1.png` | Clean runtime 5x4 candidate mission asset sheet repacked into fixed cells; no clipped cells, with green spill removed except the intentional green crystal prop. |
| `assets/mission/higgsfield_batch_props_source_20260624.jpeg` | Higgsfield Nano Banana 2 source generated from the latest reference batch for missing mission props and cyber-vault world objects. |
| `assets/mission/higgsfield_batch_props_alpha_20260624.png` | Chroma-keyed transparent source-sized version of the latest props batch. |
| `assets/mission/higgsfield_batch_props_runtime_v1.png` | Active 5x4 runtime props sheet repacked into fixed cells; no empty or clipped cells in the local audit. |
| `assets/mission/higgsfield_batch_world_source_20260624.png` | Higgsfield Nano Banana 2 world/platform element source generated from the latest reference image. |
| `assets/mission/higgsfield_batch_world_alpha_20260624.png` | Chroma-keyed transparent source-sized version of the latest world batch. |
| `assets/mission/higgsfield_batch_world_runtime_v1.png` | Archived prior 5x4 runtime world-fill sheet retained as rollback source. |
| `assets/mission/higgsfield_batch_fx_retry_source_20260624.jpeg` | Higgsfield Nano Banana 2 retry source for FX and pickups, generated after the first attempt included unwanted text labels. |
| `assets/mission/higgsfield_batch_fx_retry_alpha_20260624.png` | Chroma-keyed transparent source-sized version of the clean retry FX batch. |
| `assets/mission/higgsfield_batch_fx_retry_runtime_v1.png` | Clean 5x4 runtime candidate FX sheet with hearts, ruby pickups, keys, shields, sparks, and beams packed into equal cells. |
| `assets/backgrounds/higgsfield_photo_neon_jungle_bg_20260624.jpeg` | Active Higgsfield concept-matched neon jungle background generated from the user-approved screenshot. |
| `assets/mission/higgsfield_photo_world_retry_source_20260624.png` | Higgsfield source for cleaner complete world props from the concept reference. |
| `assets/mission/higgsfield_photo_world_retry_runtime_v1.png` | Active normalized 5x4 transparent world prop sheet from the cleaner photo/reference generation. |
| `assets/mission/higgsfield_userref_world_source_20260624.png` | Higgsfield source generated from the user-provided uploaded reference media; retained as candidate world props because some cells contain tiny readable markings. |
| `assets/mission/higgsfield_userref_world_runtime_v1.png` | Candidate normalized 5x4 transparent world prop sheet from the user-upload reference; not active yet. |
| `assets/mission/higgsfield_userref_fx_source_20260624.png` | Higgsfield source generated from the user-provided uploaded reference media for heart bullets, pickups, and FX. |
| `assets/mission/higgsfield_userref_fx_runtime_v1.png` | Candidate normalized 5x4 transparent FX sheet from the user-upload reference; retained as the source base for the separate repair. |
| `assets/mission/separate_fx_repair_cells/frame_02.png` | Separate repaired cell for FX frame 2. |
| `assets/mission/separate_fx_repair_cells/frame_03.png` | Separate repaired cell for FX frame 3. |
| `assets/mission/separate_fx_repair_cells/frame_04.png` | Separate repaired cell for FX frame 4. |
| `assets/mission/separate_fx_repair_cells/frame_05.png` | Separate repaired cell for FX frame 5. |
| `assets/mission/separate_fx_repair_cells/frame_06.png` | Separate repaired cell for FX frame 6. |
| `assets/mission/separate_fx_repair_cells/frame_17.png` | Separate repaired cell for FX frame 17 with full cannon/muzzle art. |
| `assets/mission/separate_fx_repair_cells/frame_18.png` | Separate repaired cell for FX frame 18. |
| `assets/mission/separate_fx_repair_cells/frame_19.png` | Separate repaired cell for FX frame 19. |
| `assets/mission/higgsfield_separate_fx_repair_runtime_v2.png` | Archived 5x4 FX runtime sheet repacked from the separate repaired cells. |
| `assets/mission/higgsfield_separate_cell_sources/frame_02_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 2 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_cell_sources/frame_03_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 3 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_cell_sources/frame_04_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 4 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_cell_sources/frame_05_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 5 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_cell_sources/frame_06_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 6 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_cell_sources/frame_17_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 17 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_cell_sources/frame_18_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 18 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_cell_sources/frame_19_source_higgsfield_20260624.jpeg` | Higgsfield generated source for separate FX frame 19 from the uploaded media reference. |
| `assets/mission/higgsfield_separate_fx_cells/frame_02.png` | Clean transparent Higgsfield replacement cell for FX frame 2. |
| `assets/mission/higgsfield_separate_fx_cells/frame_03.png` | Clean transparent Higgsfield replacement cell for FX frame 3. |
| `assets/mission/higgsfield_separate_fx_cells/frame_04.png` | Clean transparent Higgsfield replacement cell for FX frame 4. |
| `assets/mission/higgsfield_separate_fx_cells/frame_05.png` | Clean transparent Higgsfield replacement cell for FX frame 5. |
| `assets/mission/higgsfield_separate_fx_cells/frame_06.png` | Clean transparent Higgsfield replacement cell for FX frame 6. |
| `assets/mission/higgsfield_separate_fx_cells/frame_17.png` | Clean transparent Higgsfield replacement cell for FX frame 17. |
| `assets/mission/higgsfield_separate_fx_cells/frame_18.png` | Clean transparent Higgsfield replacement cell for FX frame 18. |
| `assets/mission/higgsfield_separate_fx_cells/frame_19.png` | Clean transparent Higgsfield replacement cell for FX frame 19. |
| `assets/mission/higgsfield_separate_fx_repair_runtime_v3.png` | Active 5x4 FX runtime sheet rebuilt from the Higgsfield separate cells with green keyed to alpha. |
| `assets/mascot/lottomind_hero_photo_atlas_source_20260624.png` | Higgsfield source 9x6 updated hero mascot atlas. |
| `assets/mascot/lottomind_hero_photo_atlas_runtime_v1.png` | Candidate normalized 8x6 hero mascot runtime atlas; not active because the original hero is preferred. |
| `assets/mascot/lottomind_hero_photo_dash_source_20260624.png` | Higgsfield source dash pose sheet for the updated hero mascot. |
| `assets/mascot/lottomind_hero_photo_dash_runtime_v1.png` | Candidate normalized 8-frame hero dash strip; not active because the original hero is preferred. |
| `assets/mascot/lottomind_hero_userref_candidate_source_20260624.png` | Higgsfield source generated from the user-uploaded media; retained as non-runtime candidate only. |
| `assets/mascot/higgsfield-hero-motion-atlas-1.webp` | Skipped hero generation; retained as source-only because the preferred runtime hero remains `lottomind-mascot-runner-atlas.png`. |
| `assets/mascot/higgsfield-hero-motion-atlas-2.webp` | Skipped hero generation; retained as source-only because the preferred runtime hero remains `lottomind-mascot-runner-atlas.png`. |

## Higgsfield Nano Banana 2 Jobs

| Asset | Job ID |
| --- | --- |
| `level1_bg_far.webp` | `6c39c332-f904-4c84-b169-06879650abc6` |
| `level2_bg_far.webp` | `d4878a23-cb6b-4fb3-86ad-a6692dd82a0c` |
| `level3_bg_far.webp` | `27ec2b6a-31b8-4616-846e-4b87e10a5a85` |
| `platform_tiles_level1.png` | `ad841d52-1af3-4805-8031-571c4aca5c79` |
| `platform_tiles_level2.png` | `1f5573c8-008a-4b9e-9405-86b8ed8bb3bd` |
| `platform_tiles_level3.png` | `45eda9e0-01ad-4316-9561-6bd4ed433b1e` |
| `canopy_drone_queen.png` | `73b8a80c-3303-4f8b-b8e0-f4887bd6ed92` |
| `jackpot_forge_titan.png` | `ebe51201-7b38-4a3b-a233-64b0815fde17` |
| `midas_heartcore_overlord.png` | `f2295ea8-7ee6-4d11-8867-9697250132cd` |
| `level_card_frame.png` | `affccc6b-4b99-43b4-bb12-e824d786bbba` |
| `boss_health_frame.png` | `cf9ebb8d-c87c-4f21-8867-309566b1d563` |
| `final_victory_badge.png` | `8c895fb4-1e38-4cdd-93c9-268a9cdf617f` |
| `enemy_crawler.png` | `bd5c5ed9-adf9-4e91-a0cf-d2770ef4e357`; cutout `c680910d-7915-4a9d-8400-add1d5fe8b86` |
| `enemy_drone.png` | `ce8700b8-45ac-441d-9c8a-179b70138fd4`; cutout `1315b451-82a6-411d-b06e-a484dfa109fd` |
| `enemy_shield_guard.png` | `efd14934-2c7c-407a-92a0-190e0df07e65`; cutout `85f10d55-af28-4e91-bfd6-53313266373f` |
| `enemy_turret.png` | `0223d8f6-cd42-4ca2-aab5-128d54045af2`; cutout `eb744f18-6033-4018-aa3d-318b3dd675da` |
| `higgsfield_enemy_motion_sheet_alpha.png` | `9e5dcb4a-7365-4fd4-85eb-be1c988219b9`; local checker cleanup |
| `higgsfield_mission_fx_collectibles_sheet_alpha.png` | `d8e8f39b-f163-42c9-89b8-d051947b61e9`; local checker cleanup |
| `higgsfield_background_props_sheet_alpha.png` | `ae3f5669-1883-412b-bd54-67a8d1a2fb4d`; local checker cleanup |
| `higgsfield_reference_assets_runtime_v1.png` | `b423ba14-09fa-470c-9752-0508a4cd2edc`; local chroma-key and fixed-cell repack |
| `higgsfield_batch_props_runtime_v1.png` | `03981bc1-6a72-40b1-bc91-176a95571064`; local chroma-key and fixed-cell repack |
| `higgsfield_batch_fx_retry_runtime_v1.png` | `43311fa3-86bc-4217-8fcd-ade64f4722dc`; retry without labels, local chroma-key and fixed-cell repack |
| `higgsfield_batch_world_runtime_v1.png` | `0622b5e9-f15c-4739-8408-31ce8b716840`; local chroma-key and fixed-cell repack |

Detailed byte counts are in `docs/higgsfield-generated-assets.json`.

No provider tokens, signed upload URLs, or secrets are stored in the project.
