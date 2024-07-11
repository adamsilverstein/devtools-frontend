// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as TraceEngine from '../../models/trace/trace.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';

import {buildGroupStyle, buildTrackHeader, getFormattedTime} from './AppenderUtils.js';
import {
  type CompatibilityTracksAppender,
  type HighlightedEntryInfo,
  type TrackAppender,
  type TrackAppenderName,
  VisualLoggingTrackName,
} from './CompatibilityTracksAppender.js';
import * as Extensions from './extensions/extensions.js';

export class ExtensionTrackAppender implements TrackAppender {
  readonly appenderName: TrackAppenderName = 'Extension';

  #extensionTopLevelTrack: TraceEngine.Types.Extensions.ExtensionTrackData;
  #compatibilityBuilder: CompatibilityTracksAppender;
  constructor(
      compatibilityBuilder: CompatibilityTracksAppender,
      extensionTracks: TraceEngine.Types.Extensions.ExtensionTrackData) {
    this.#extensionTopLevelTrack = extensionTracks;
    this.#compatibilityBuilder = compatibilityBuilder;
  }

  appendTrackAtLevel(trackStartLevel: number, expanded?: boolean): number {
    const totalEntryCount =
        Object.values(this.#extensionTopLevelTrack.entriesByTrack).reduce((prev, current) => current.length + prev, 0);
    if (totalEntryCount === 0) {
      return trackStartLevel;
    }
    this.#appendTopLevelHeaderAtLevel(trackStartLevel, expanded);
    return this.#appendExtensionTrackData(trackStartLevel);
  }

  /**
   * Appends the top level header for a track. Extension entries can be
   * added to tracks or sub-tracks. In the former case, the top level
   * header corresponds to the track name, in the latter it corresponds
   * to the track group name.
   */
  #appendTopLevelHeaderAtLevel(currentLevel: number, expanded?: boolean): void {
    const style = buildGroupStyle({shareHeaderLine: false, collapsible: true});
    const headerTitle = this.#extensionTopLevelTrack.name;
    const group = buildTrackHeader(
        VisualLoggingTrackName.EXTENSION, currentLevel, headerTitle, style,
        /* selectable= */ true, expanded);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  /**
   * Appends the second level header for a grouped track, which
   * corresponds to the track name itself, instead of the track name.
   */
  #appendSecondLevelHeader(trackStartLevel: number, headerTitle: string): void {
    const style = buildGroupStyle({shareHeaderLine: false, padding: 2, nestingLevel: 1, collapsible: true});
    const group = buildTrackHeader(
        VisualLoggingTrackName.EXTENSION, trackStartLevel, headerTitle, style,
        /* selectable= */ true);
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }

  #appendExtensionTrackData(trackStartLevel: number): number {
    let currentStartLevel = trackStartLevel;
    for (const [trackName, entries] of Object.entries(this.#extensionTopLevelTrack.entriesByTrack)) {
      if (this.#extensionTopLevelTrack.isTrackGroup) {
        // Second level header is used for only sub-tracks.
        this.#appendSecondLevelHeader(currentStartLevel, trackName as string);
      }
      currentStartLevel = this.#compatibilityBuilder.appendEventsAtLevel(entries, currentStartLevel, this);
    }
    return currentStartLevel;
  }

  colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    const defaultColor = ThemeSupport.ThemeSupport.instance().getComputedValue('--app-color-rendering');
    if (!TraceEngine.Types.Extensions.isSyntheticExtensionEntry(event)) {
      return defaultColor;
    }
    return Extensions.ExtensionUI.extensionEntryColor(event);
  }

  titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string {
    if (!TraceEngine.Types.Extensions.isSyntheticExtensionEntry(event)) {
      return ThemeSupport.ThemeSupport.instance().getComputedValue('--app-color-rendering');
    }
    return event.name;
  }

  /**
   * Returns the info shown when an event added by this appender
   * is hovered in the timeline.
   */
  highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo {
    const title = TraceEngine.Types.Extensions.isSyntheticExtensionEntry(event) && event.args.hintText ?
        event.args.hintText :
        this.titleForEvent(event);
    return {title, formattedTime: getFormattedTime(event.dur)};
  }
}
