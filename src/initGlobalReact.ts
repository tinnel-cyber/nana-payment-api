import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { getSafeStoreSlug } from './utils/slugEngine';

// =============================================================================
// BOUCLIER DE SÉCURITÉ GLOBAL ANTI-REFERENCEERROR (REACT HOOKS & STORESLUG)
// Attachement inconditionnel au démarrage de tous les hooks essentiels et de storeSlug
// =============================================================================

const initialStoreSlug = (() => {
  if (typeof window !== 'undefined') {
    try {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/(?:s|shop|boutique|store|vitrine)\/([^/?#]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).replace(/^store-/, '') || 'ma-boutique';
      }
      const params = new URLSearchParams(window.location.search);
      const q = params.get('store') || params.get('shop') || params.get('boutique') || params.get('storeSlug') || params.get('slug');
      if (q) return q.replace(/^store-/, '') || 'ma-boutique';
    } catch {}
  }
  return 'ma-boutique';
})();

const globalSafetyBindings = {
  React,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
  storeSlug: initialStoreSlug,
  getSafeStoreSlug,
};

if (typeof window !== 'undefined') {
  Object.assign(window, globalSafetyBindings);
}

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, globalSafetyBindings);
}

export { React, useState, useEffect, useCallback, useMemo, useRef, useContext, getSafeStoreSlug };
export default globalSafetyBindings;

