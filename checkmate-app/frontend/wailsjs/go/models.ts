export namespace code {
	
	export class Position {
	    line: number;
	    character: number;
	
	    static createFrom(source: any = {}) {
	        return new Position(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.line = source["line"];
	        this.character = source["character"];
	    }
	}
	export class Range {
	    start: Position;
	    end: Position;
	
	    static createFrom(source: any = {}) {
	        return new Range(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.start = this.convertValues(source["start"], Position);
	        this.end = this.convertValues(source["end"], Position);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace diagnostics {
	
	export class CharRange {
	    StartIndex: number;
	    EndIndex: number;
	
	    static createFrom(source: any = {}) {
	        return new CharRange(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.StartIndex = source["StartIndex"];
	        this.EndIndex = source["EndIndex"];
	    }
	}
	export class Evidence {
	    description: string;
	    confidence: number;
	
	    static createFrom(source: any = {}) {
	        return new Evidence(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.description = source["description"];
	        this.confidence = source["confidence"];
	    }
	}
	export class ExcludeDefinition {
	    GloballyExcludedRegExs: string[];
	    GloballyExcludedStrings: string[];
	    GloballyExcludedHashes: string[];
	    PathExclusionRegExs: string[];
	    PerFileExcludedStrings: Record<string, Array<string>>;
	    PerFileExcludedHashes: Record<string, Array<string>>;
	    PathRegexExcludedRegExs: Record<string, Array<string>>;
	
	    static createFrom(source: any = {}) {
	        return new ExcludeDefinition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.GloballyExcludedRegExs = source["GloballyExcludedRegExs"];
	        this.GloballyExcludedStrings = source["GloballyExcludedStrings"];
	        this.GloballyExcludedHashes = source["GloballyExcludedHashes"];
	        this.PathExclusionRegExs = source["PathExclusionRegExs"];
	        this.PerFileExcludedStrings = source["PerFileExcludedStrings"];
	        this.PerFileExcludedHashes = source["PerFileExcludedHashes"];
	        this.PathRegexExcludedRegExs = source["PathRegexExcludedRegExs"];
	    }
	}
	export class Justification {
	    headline?: Evidence;
	    reasons?: Evidence[];
	
	    static createFrom(source: any = {}) {
	        return new Justification(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.headline = this.convertValues(source["headline"], Evidence);
	        this.reasons = this.convertValues(source["reasons"], Evidence);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SecurityDiagnostic {
	    justification?: Justification;
	    range?: code.Range;
	    rawRange?: CharRange;
	    highlightRange?: code.Range;
	    source?: string;
	    sha256?: string;
	    location?: string;
	    providerID?: string;
	    Excluded: boolean;
	    tags?: string[];
	
	    static createFrom(source: any = {}) {
	        return new SecurityDiagnostic(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.justification = this.convertValues(source["justification"], Justification);
	        this.range = this.convertValues(source["range"], code.Range);
	        this.rawRange = this.convertValues(source["rawRange"], CharRange);
	        this.highlightRange = this.convertValues(source["highlightRange"], code.Range);
	        this.source = source["source"];
	        this.sha256 = source["sha256"];
	        this.location = source["location"];
	        this.providerID = source["providerID"];
	        this.Excluded = source["Excluded"];
	        this.tags = source["tags"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace gitutils {
	
	export class Commit {
	    Name: string;
	    Email: string;
	    Hash: string;
	    Branch: string;
	    // Go type: time
	    Time: any;
	    IsHead: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Commit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Email = source["Email"];
	        this.Hash = source["Hash"];
	        this.Branch = source["Branch"];
	        this.Time = this.convertValues(source["Time"], null);
	        this.IsHead = source["IsHead"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace main {
	
	export class CategoryDistribution {
	    category: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new CategoryDistribution(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.category = source["category"];
	        this.count = source["count"];
	    }
	}
	export class DashboardTrendPoint {
	    date: string;
	    total: number;
	    critical: number;
	    high: number;
	    medium: number;
	    low: number;
	
	    static createFrom(source: any = {}) {
	        return new DashboardTrendPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.total = source["total"];
	        this.critical = source["critical"];
	        this.high = source["high"];
	        this.medium = source["medium"];
	        this.low = source["low"];
	    }
	}
	export class ROIFixRecommendation {
	    id: string;
	    title: string;
	    description: string;
	    impactCount: number;
	    impactPercent: number;
	    category: string;
	    targetProjectId: string;
	    targetScanId: string;
	    targetFile?: string;
	    checksum?: string;
	
	    static createFrom(source: any = {}) {
	        return new ROIFixRecommendation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.impactCount = source["impactCount"];
	        this.impactPercent = source["impactPercent"];
	        this.category = source["category"];
	        this.targetProjectId = source["targetProjectId"];
	        this.targetScanId = source["targetScanId"];
	        this.targetFile = source["targetFile"];
	        this.checksum = source["checksum"];
	    }
	}
	export class ReusedSecretInsight {
	    checksum: string;
	    secretType: string;
	    occurrences: number;
	    projectIds: string[];
	    projectNames: string[];
	    workspaces: string[];
	    samplePath: string;
	    severity: string;
	
	    static createFrom(source: any = {}) {
	        return new ReusedSecretInsight(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.checksum = source["checksum"];
	        this.secretType = source["secretType"];
	        this.occurrences = source["occurrences"];
	        this.projectIds = source["projectIds"];
	        this.projectNames = source["projectNames"];
	        this.workspaces = source["workspaces"];
	        this.samplePath = source["samplePath"];
	        this.severity = source["severity"];
	    }
	}
	export class ProjectExposure {
	    projectId: string;
	    projectName: string;
	    workspace: string;
	    totalFindings: number;
	    criticalCount: number;
	    highCount: number;
	    mediumCount: number;
	    lowCount: number;
	    prodLeaks: number;
	    nonProdLeaks: number;
	    securityScore: number;
	    lastScanDate: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectExposure(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projectId = source["projectId"];
	        this.projectName = source["projectName"];
	        this.workspace = source["workspace"];
	        this.totalFindings = source["totalFindings"];
	        this.criticalCount = source["criticalCount"];
	        this.highCount = source["highCount"];
	        this.mediumCount = source["mediumCount"];
	        this.lowCount = source["lowCount"];
	        this.prodLeaks = source["prodLeaks"];
	        this.nonProdLeaks = source["nonProdLeaks"];
	        this.securityScore = source["securityScore"];
	        this.lastScanDate = source["lastScanDate"];
	    }
	}
	export class WorkspaceMetrics {
	    workspaceName: string;
	    projectCount: number;
	    totalFindings: number;
	    criticalCount: number;
	    highCount: number;
	    mediumCount: number;
	    lowCount: number;
	    productionLeaks: number;
	    nonProductionLeaks: number;
	    securityScore: number;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspaceName = source["workspaceName"];
	        this.projectCount = source["projectCount"];
	        this.totalFindings = source["totalFindings"];
	        this.criticalCount = source["criticalCount"];
	        this.highCount = source["highCount"];
	        this.mediumCount = source["mediumCount"];
	        this.lowCount = source["lowCount"];
	        this.productionLeaks = source["productionLeaks"];
	        this.nonProductionLeaks = source["nonProductionLeaks"];
	        this.securityScore = source["securityScore"];
	    }
	}
	export class DashboardAnalytics {
	    totalWorkspaces: number;
	    totalProjects: number;
	    totalFindings: number;
	    criticalFindings: number;
	    highFindings: number;
	    mediumFindings: number;
	    lowFindings: number;
	    excludedFindings: number;
	    productionLeaks: number;
	    nonProductionLeaks: number;
	    uniqueSecretsCount: number;
	    reusedSecretsCount: number;
	    reusedSecretLeaks: number;
	    overallSecurityScore: number;
	    workspaceBreakdown: WorkspaceMetrics[];
	    projectBreakdown: ProjectExposure[];
	    topReusedSecrets: ReusedSecretInsight[];
	    topRoiFixes: ROIFixRecommendation[];
	    secretCategories: CategoryDistribution[];
	    trends: DashboardTrendPoint[];
	
	    static createFrom(source: any = {}) {
	        return new DashboardAnalytics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalWorkspaces = source["totalWorkspaces"];
	        this.totalProjects = source["totalProjects"];
	        this.totalFindings = source["totalFindings"];
	        this.criticalFindings = source["criticalFindings"];
	        this.highFindings = source["highFindings"];
	        this.mediumFindings = source["mediumFindings"];
	        this.lowFindings = source["lowFindings"];
	        this.excludedFindings = source["excludedFindings"];
	        this.productionLeaks = source["productionLeaks"];
	        this.nonProductionLeaks = source["nonProductionLeaks"];
	        this.uniqueSecretsCount = source["uniqueSecretsCount"];
	        this.reusedSecretsCount = source["reusedSecretsCount"];
	        this.reusedSecretLeaks = source["reusedSecretLeaks"];
	        this.overallSecurityScore = source["overallSecurityScore"];
	        this.workspaceBreakdown = this.convertValues(source["workspaceBreakdown"], WorkspaceMetrics);
	        this.projectBreakdown = this.convertValues(source["projectBreakdown"], ProjectExposure);
	        this.topReusedSecrets = this.convertValues(source["topReusedSecrets"], ReusedSecretInsight);
	        this.topRoiFixes = this.convertValues(source["topRoiFixes"], ROIFixRecommendation);
	        this.secretCategories = this.convertValues(source["secretCategories"], CategoryDistribution);
	        this.trends = this.convertValues(source["trends"], DashboardTrendPoint);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Metrics {
	    criticalFindings: number;
	    projectsScanned: number;
	    securityScore: string;
	
	    static createFrom(source: any = {}) {
	        return new Metrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.criticalFindings = source["criticalFindings"];
	        this.projectsScanned = source["projectsScanned"];
	        this.securityScore = source["securityScore"];
	    }
	}
	
	
	
	export class ScanHistory {
	    ID: string;
	    Status: string;
	    StartedAt: string;
	    Metrics?: store.ScanMetrics;
	
	    static createFrom(source: any = {}) {
	        return new ScanHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Status = source["Status"];
	        this.StartedAt = source["StartedAt"];
	        this.Metrics = this.convertValues(source["Metrics"], store.ScanMetrics);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SuppressionOptions {
	    scopeType: string;
	    matchString: string;
	    path: string;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new SuppressionOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.scopeType = source["scopeType"];
	        this.matchString = source["matchString"];
	        this.path = source["path"];
	        this.reason = source["reason"];
	    }
	}

}

export namespace projects {
	
	export class SecretLocation {
	    Location: string;
	    highLightRange: code.Range;
	
	    static createFrom(source: any = {}) {
	        return new SecretLocation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Location = source["Location"];
	        this.highLightRange = this.convertValues(source["highLightRange"], code.Range);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReusedSecret {
	    Secret: string;
	    productionLocations: SecretLocation[];
	    nonProductionLocations: SecretLocation[];
	
	    static createFrom(source: any = {}) {
	        return new ReusedSecret(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Secret = source["Secret"];
	        this.productionLocations = this.convertValues(source["productionLocations"], SecretLocation);
	        this.nonProductionLocations = this.convertValues(source["nonProductionLocations"], SecretLocation);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Model {
	    Grade: string;
	    criticalCount: number;
	    highCount: number;
	    mediumCount: number;
	    lowCount: number;
	    informationalCount: number;
	    productionConfidentialFilesCount: number;
	    fileCount: number;
	    skippedCount: number;
	    issuesPerType: number;
	    averagePerFile: number;
	    timeStamp: string;
	    showSource: boolean;
	    reusedSecretsCount: number;
	    numberOfSecretsReuse: number;
	    prodAndNonProdSecretReuse: ReusedSecret[];
	    prodSecretsCount: number;
	    criticalProdUsedInNonProdCount: number;
	    highProdUsedInNonProdCount: number;
	    mediumProdUsedInNonProdCount: number;
	    lowProdUsedInNonProdCount: number;
	    infoProdUsedInNonProdCount: number;
	    criticalSensitiveFileCount: number;
	    highSensitiveFileCount: number;
	    mediumSensitiveFileCount: number;
	    lowSensitiveFileCount: number;
	    infoSensitiveFileCount: number;
	    nonProdSensitiveFileCount: number;
	    secretReuseCountBuckets: number[];
	
	    static createFrom(source: any = {}) {
	        return new Model(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Grade = source["Grade"];
	        this.criticalCount = source["criticalCount"];
	        this.highCount = source["highCount"];
	        this.mediumCount = source["mediumCount"];
	        this.lowCount = source["lowCount"];
	        this.informationalCount = source["informationalCount"];
	        this.productionConfidentialFilesCount = source["productionConfidentialFilesCount"];
	        this.fileCount = source["fileCount"];
	        this.skippedCount = source["skippedCount"];
	        this.issuesPerType = source["issuesPerType"];
	        this.averagePerFile = source["averagePerFile"];
	        this.timeStamp = source["timeStamp"];
	        this.showSource = source["showSource"];
	        this.reusedSecretsCount = source["reusedSecretsCount"];
	        this.numberOfSecretsReuse = source["numberOfSecretsReuse"];
	        this.prodAndNonProdSecretReuse = this.convertValues(source["prodAndNonProdSecretReuse"], ReusedSecret);
	        this.prodSecretsCount = source["prodSecretsCount"];
	        this.criticalProdUsedInNonProdCount = source["criticalProdUsedInNonProdCount"];
	        this.highProdUsedInNonProdCount = source["highProdUsedInNonProdCount"];
	        this.mediumProdUsedInNonProdCount = source["mediumProdUsedInNonProdCount"];
	        this.lowProdUsedInNonProdCount = source["lowProdUsedInNonProdCount"];
	        this.infoProdUsedInNonProdCount = source["infoProdUsedInNonProdCount"];
	        this.criticalSensitiveFileCount = source["criticalSensitiveFileCount"];
	        this.highSensitiveFileCount = source["highSensitiveFileCount"];
	        this.mediumSensitiveFileCount = source["mediumSensitiveFileCount"];
	        this.lowSensitiveFileCount = source["lowSensitiveFileCount"];
	        this.infoSensitiveFileCount = source["infoSensitiveFileCount"];
	        this.nonProdSensitiveFileCount = source["nonProdSensitiveFileCount"];
	        this.secretReuseCountBuckets = source["secretReuseCountBuckets"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Score {
	    Grade: string;
	    Metric: number;
	    // Go type: time
	    TimeStamp: any;
	    SubMetrics: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new Score(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Grade = source["Grade"];
	        this.Metric = source["Metric"];
	        this.TimeStamp = this.convertValues(source["TimeStamp"], null);
	        this.SubMetrics = source["SubMetrics"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScanSummary {
	    Score: Score;
	    CommitHash: string;
	    AdditionalInfo?: Model;
	
	    static createFrom(source: any = {}) {
	        return new ScanSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Score = this.convertValues(source["Score"], Score);
	        this.CommitHash = source["CommitHash"];
	        this.AdditionalInfo = this.convertValues(source["AdditionalInfo"], Model);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScanPolicy {
	    ID: string;
	    Policy: diagnostics.ExcludeDefinition;
	    PolicyString: string;
	    Config: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new ScanPolicy(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Policy = this.convertValues(source["Policy"], diagnostics.ExcludeDefinition);
	        this.PolicyString = source["PolicyString"];
	        this.Config = source["Config"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Repository {
	    Location: string;
	    LocationType: string;
	    GitServiceID: string;
	    Monitor: boolean;
	    Attributes?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new Repository(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Location = source["Location"];
	        this.LocationType = source["LocationType"];
	        this.GitServiceID = source["GitServiceID"];
	        this.Monitor = source["Monitor"];
	        this.Attributes = source["Attributes"];
	    }
	}
	export class ProjectSummary {
	    ID: string;
	    Name: string;
	    Description?: string;
	    Workspace: string;
	    Repositories?: Repository[];
	    ScanAndCommitHistories?: Record<string, any>;
	    LastScanID: string;
	    ScanIDs: string[];
	    ScanPolicy: ScanPolicy;
	    ScoreTrend?: Record<string, number>;
	    LastScanSummary: ScanSummary;
	    LastScore: Score;
	    IsBeingScanned: boolean;
	    // Go type: time
	    CreationDate: any;
	    // Go type: time
	    LastModification: any;
	    // Go type: time
	    LastScan: any;
	
	    static createFrom(source: any = {}) {
	        return new ProjectSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Name = source["Name"];
	        this.Description = source["Description"];
	        this.Workspace = source["Workspace"];
	        this.Repositories = this.convertValues(source["Repositories"], Repository);
	        this.ScanAndCommitHistories = source["ScanAndCommitHistories"];
	        this.LastScanID = source["LastScanID"];
	        this.ScanIDs = source["ScanIDs"];
	        this.ScanPolicy = this.convertValues(source["ScanPolicy"], ScanPolicy);
	        this.ScoreTrend = source["ScoreTrend"];
	        this.LastScanSummary = this.convertValues(source["LastScanSummary"], ScanSummary);
	        this.LastScore = this.convertValues(source["LastScore"], Score);
	        this.IsBeingScanned = source["IsBeingScanned"];
	        this.CreationDate = this.convertValues(source["CreationDate"], null);
	        this.LastModification = this.convertValues(source["LastModification"], null);
	        this.LastScan = this.convertValues(source["LastScan"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ScanHistory {
	    // Go type: time
	    Time: any;
	    ScanID: string;
	    Commit: gitutils.Commit;
	
	    static createFrom(source: any = {}) {
	        return new ScanHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Time = this.convertValues(source["Time"], null);
	        this.ScanID = source["ScanID"];
	        this.Commit = this.convertValues(source["Commit"], gitutils.Commit);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RepositoryHistory {
	    Repository: Repository;
	    ScanHistories: ScanHistory[];
	    CommitHistories: gitutils.Commit[];
	
	    static createFrom(source: any = {}) {
	        return new RepositoryHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Repository = this.convertValues(source["Repository"], Repository);
	        this.ScanHistories = this.convertValues(source["ScanHistories"], ScanHistory);
	        this.CommitHistories = this.convertValues(source["CommitHistories"], gitutils.Commit);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	

}

export namespace store {
	
	export class AuditEvent {
	    action: string;
	    // Go type: time
	    timestamp: any;
	    user: string;
	    details?: string;
	
	    static createFrom(source: any = {}) {
	        return new AuditEvent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.action = source["action"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.user = source["user"];
	        this.details = source["details"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExceptionEvidence {
	    fileHash?: string;
	    commitSha?: string;
	
	    static createFrom(source: any = {}) {
	        return new ExceptionEvidence(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileHash = source["fileHash"];
	        this.commitSha = source["commitSha"];
	    }
	}
	export class ExceptionScopeDetail {
	    type: string;
	    repoUrl?: string;
	    path?: string;
	    lineStart?: number;
	    lineEnd?: number;
	    secretChecksum?: string;
	    stringMatch?: string;
	    regexMatch?: string;
	
	    static createFrom(source: any = {}) {
	        return new ExceptionScopeDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.repoUrl = source["repoUrl"];
	        this.path = source["path"];
	        this.lineStart = source["lineStart"];
	        this.lineEnd = source["lineEnd"];
	        this.secretChecksum = source["secretChecksum"];
	        this.stringMatch = source["stringMatch"];
	        this.regexMatch = source["regexMatch"];
	    }
	}
	export class Exception {
	    id: string;
	    projectId?: string;
	    ruleId: string;
	    scope?: ExceptionScopeDetail;
	    reason: string;
	    justification?: string;
	    createdBy: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    expiresAt?: any;
	    status: string;
	    evidence?: ExceptionEvidence;
	    tags?: string[];
	    auditTrail?: AuditEvent[];
	
	    static createFrom(source: any = {}) {
	        return new Exception(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.ruleId = source["ruleId"];
	        this.scope = this.convertValues(source["scope"], ExceptionScopeDetail);
	        this.reason = source["reason"];
	        this.justification = source["justification"];
	        this.createdBy = source["createdBy"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.expiresAt = this.convertValues(source["expiresAt"], null);
	        this.status = source["status"];
	        this.evidence = this.convertValues(source["evidence"], ExceptionEvidence);
	        this.tags = source["tags"];
	        this.auditTrail = this.convertValues(source["auditTrail"], AuditEvent);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class ScanMetrics {
	    totalFindings: number;
	    findingsBySeverity: Record<string, number>;
	    score: number;
	
	    static createFrom(source: any = {}) {
	        return new ScanMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalFindings = source["totalFindings"];
	        this.findingsBySeverity = source["findingsBySeverity"];
	        this.score = source["score"];
	    }
	}

}

