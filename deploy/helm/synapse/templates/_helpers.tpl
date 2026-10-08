{{- define "synapse.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "synapse.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "synapse.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "synapse.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "synapse.labels" -}}
helm.sh/chart: {{ include "synapse.chart" . }}
{{ include "synapse.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
synapse.io/environment: {{ .Values.global.environment | quote }}
{{- end }}

{{- define "synapse.selectorLabels" -}}
app.kubernetes.io/name: {{ include "synapse.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "synapse.secretRef" -}}
{{- if .Values.secrets.create }}
{{ include "synapse.fullname" . }}-secrets
{{- else }}
{{ .Values.secrets.existingSecret }}
{{- end }}
{{- end }}

